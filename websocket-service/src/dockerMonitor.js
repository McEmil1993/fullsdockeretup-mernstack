const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const mongoose = require('mongoose');

// MongoDB connection (removed from here - will be handled in server.js)

class DockerMonitor {
  constructor() {
    this.thresholds = {
      cpu: 80,        // CPU usage threshold (%)
      memory: 85,     // Memory usage threshold (%)
      critical_cpu: 95,
      critical_memory: 95
    };
  }

  /**
   * Execute Docker command
   */
  async executeDockerCommand(command) {
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr && !stderr.includes('WARNING')) {
        console.error('Docker command stderr:', stderr);
      }
      return stdout.trim();
    } catch (error) {
      console.error('Docker command error:', error.message);
      throw new Error(`Docker command failed: ${error.message}`);
    }
  }

  /**
   * Get all container stats with CPU and Memory usage
   */
  async getContainerStats() {
    try {
      const output = await this.executeDockerCommand(
        "docker stats --no-stream --format '{{.ID}}|{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}'"
      );

      if (!output) return [];

      const lines = output.split('\n').filter(line => line.trim());
      return lines.map(line => {
        const [id, name, cpuPerc, memUsage, memPerc, netIO, blockIO] = line.split('|');
        
        // Parse and validate CPU percentage
        const cpuValue = parseFloat((cpuPerc || '0').replace('%', ''));
        const memValue = parseFloat((memPerc || '0').replace('%', ''));

        return {
          id: id.substring(0, 12),
          name,
          cpuPerc: isNaN(cpuValue) ? 0 : cpuValue,
          memUsage: memUsage || 'N/A',
          memPerc: isNaN(memValue) ? 0 : memValue,
          netIO: netIO || 'N/A',
          blockIO: blockIO || 'N/A',
          timestamp: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error getting container stats:', error);
      return [];
    }
  }

  /**
   * Get host CPU usage (realtime)
   */
  async getHostCPUUsage() {
    try {
      // Read /proc/stat for CPU usage
      const { stdout: stat1 } = await execAsync('cat /proc/stat | grep "^cpu "');
      
      // Wait a short time to calculate usage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { stdout: stat2 } = await execAsync('cat /proc/stat | grep "^cpu "');
      
      const parseCPUStat = (stat) => {
        const values = stat.trim().split(/\s+/).slice(1).map(Number);
        return {
          user: values[0],
          nice: values[1],
          system: values[2],
          idle: values[3],
          iowait: values[4],
          irq: values[5],
          softirq: values[6]
        };
      };
      
      const cpu1 = parseCPUStat(stat1);
      const cpu2 = parseCPUStat(stat2);
      
      const idle1 = cpu1.idle + cpu1.iowait;
      const idle2 = cpu2.idle + cpu2.iowait;
      
      const total1 = Object.values(cpu1).reduce((a, b) => a + b, 0);
      const total2 = Object.values(cpu2).reduce((a, b) => a + b, 0);
      
      const totalDiff = total2 - total1;
      const idleDiff = idle2 - idle1;
      
      const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
      
      // Get number of CPU cores
      const { stdout: cpuinfo } = await execAsync('nproc');
      const cores = parseInt(cpuinfo.trim());
      
      return {
        usage: parseFloat(usage.toFixed(1)),
        cores: cores,
        percentage: parseFloat(usage.toFixed(1))
      };
    } catch (error) {
      console.error('Error getting host CPU usage:', error);
      return null;
    }
  }

  /**
   * Get host memory usage (realtime)
   */
  async getHostMemoryUsage() {
    try {
      // Get memory info from /proc/meminfo
      const { stdout } = await execAsync('cat /proc/meminfo');
      const lines = stdout.split('\n');
      
      let memTotal = 0;
      let memAvailable = 0;
      
      lines.forEach(line => {
        if (line.startsWith('MemTotal:')) {
          memTotal = parseInt(line.split(/\s+/)[1]) * 1024; // Convert KB to bytes
        } else if (line.startsWith('MemAvailable:')) {
          memAvailable = parseInt(line.split(/\s+/)[1]) * 1024; // Convert KB to bytes
        }
      });
      
      const memUsed = memTotal - memAvailable;
      const memUsedGB = (memUsed / (1024 ** 3)).toFixed(2);
      const memTotalGB = (memTotal / (1024 ** 3)).toFixed(2);
      const memPercentage = ((memUsed / memTotal) * 100).toFixed(1);
      
      return {
        used: memUsed,
        usedGB: memUsedGB,
        total: memTotal,
        totalGB: memTotalGB,
        available: memAvailable,
        percentage: parseFloat(memPercentage)
      };
    } catch (error) {
      console.error('Error getting host memory usage:', error);
      return null;
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    try {
      const infoOutput = await this.executeDockerCommand('docker info --format json');
      const info = JSON.parse(infoOutput);

      // Get realtime host memory and CPU usage
      const hostMemory = await this.getHostMemoryUsage();
      const hostCPU = await this.getHostCPUUsage();

      return {
        containers: {
          total: info.Containers || 0,
          running: info.ContainersRunning || 0,
          paused: info.ContainersPaused || 0,
          stopped: info.ContainersStopped || 0
        },
        images: info.Images || 0,
        serverVersion: info.ServerVersion || 'N/A',
        memory: {
          total: info.MemTotal || 0,
          totalGB: ((info.MemTotal || 0) / (1024 ** 3)).toFixed(2),
          // Add realtime host memory stats
          host: hostMemory
        },
        cpu: {
          cores: info.NCPU || 0,
          // Add realtime host CPU stats
          host: hostCPU
        },
        cpus: info.NCPU || 0,
        architecture: info.Architecture || 'N/A',
        operatingSystem: info.OperatingSystem || 'N/A',
        kernelVersion: info.KernelVersion || 'N/A'
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return null;
    }
  }

  /**
   * Check for critical conditions and generate alerts
   */
  generateAlerts(stats) {
    const alerts = [];
    const now = new Date().toISOString();

    stats.forEach(stat => {
      // Critical CPU alert
      if (stat.cpuPerc >= this.thresholds.critical_cpu) {
        alerts.push({
          type: 'critical',
          category: 'cpu',
          message: `CRITICAL: Container "${stat.name}" CPU usage at ${stat.cpuPerc.toFixed(1)}%`,
          recommendation: 'Immediate action required. Consider scaling or restarting the container.',
          value: stat.cpuPerc,
          threshold: this.thresholds.critical_cpu,
          containerId: stat.id,
          containerName: stat.name,
          timestamp: now
        });
      } else if (stat.cpuPerc >= this.thresholds.cpu) {
        alerts.push({
          type: 'warning',
          category: 'cpu',
          message: `WARNING: Container "${stat.name}" CPU usage at ${stat.cpuPerc.toFixed(1)}%`,
          recommendation: 'Monitor closely. Consider optimizing or scaling.',
          value: stat.cpuPerc,
          threshold: this.thresholds.cpu,
          containerId: stat.id,
          containerName: stat.name,
          timestamp: now
        });
      }

      // Critical Memory alert
      if (stat.memPerc >= this.thresholds.critical_memory) {
        alerts.push({
          type: 'critical',
          category: 'memory',
          message: `CRITICAL: Container "${stat.name}" Memory usage at ${stat.memPerc.toFixed(1)}%`,
          recommendation: 'Immediate action required. Container may crash or be killed by OOM killer.',
          value: stat.memPerc,
          threshold: this.thresholds.critical_memory,
          containerId: stat.id,
          containerName: stat.name,
          timestamp: now
        });
      } else if (stat.memPerc >= this.thresholds.memory) {
        alerts.push({
          type: 'warning',
          category: 'memory',
          message: `WARNING: Container "${stat.name}" Memory usage at ${stat.memPerc.toFixed(1)}%`,
          recommendation: 'Monitor closely. Consider increasing memory limits.',
          value: stat.memPerc,
          threshold: this.thresholds.memory,
          containerId: stat.id,
          containerName: stat.name,
          timestamp: now
        });
      }
    });

    return alerts;
  }

  /**
   * Get comprehensive monitoring data
   */
  async getMonitoringData() {
    try {
      const [stats, systemInfo] = await Promise.all([
        this.getContainerStats(),
        this.getSystemInfo()
      ]);

      const alerts = this.generateAlerts(stats);

      return {
        stats,
        systemInfo,
        alerts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting monitoring data:', error);
      throw error;
    }
  }

  /**
   * Start monitoring Docker events (start, stop, restart, die, etc.)
   */
  startEventMonitoring(callback) {
    try {
      // Use docker events to monitor container lifecycle events
      const eventsCommand = exec('docker events --format "{{json .}}" --filter "type=container"');
      
      eventsCommand.stdout.on('data', (data) => {
        try {
          const lines = data.toString().trim().split('\n');
          lines.forEach(line => {
            if (!line) return;
            
            const event = JSON.parse(line);
            const { status, Action, Actor, time, timeNano } = event;
            
            // Get container info
            const containerId = Actor?.ID || '';
            const containerName = Actor?.Attributes?.name || 'Unknown';
            const image = Actor?.Attributes?.image || '';
            
            // Map critical events
            const criticalEvents = ['die', 'kill', 'oom', 'stop'];
            const warningEvents = ['pause', 'restart', 'start', 'unpause'];
            
            const actionStatus = status || Action;
            
            if (criticalEvents.includes(actionStatus)) {
              callback({
                type: 'critical',
                category: 'container',
                action: actionStatus,
                message: `Container "${containerName}" ${actionStatus === 'die' ? 'died unexpectedly' : actionStatus}`,
                recommendation: this.getRecommendation(actionStatus),
                containerId: containerId.substring(0, 12),
                containerName,
                image,
                timestamp: new Date(time * 1000).toISOString()
              });
            } else if (warningEvents.includes(actionStatus)) {
              callback({
                type: 'info',
                category: 'container',
                action: actionStatus,
                message: `Container "${containerName}" ${actionStatus}`,
                recommendation: null,
                containerId: containerId.substring(0, 12),
                containerName,
                image,
                timestamp: new Date(time * 1000).toISOString()
              });
            }
          });
        } catch (err) {
          console.error('Error parsing Docker event:', err);
        }
      });

      eventsCommand.stderr.on('data', (data) => {
        console.error('Docker events error:', data.toString());
      });

      eventsCommand.on('exit', (code) => {
        console.log(`Docker events monitor exited with code ${code}`);
        // Restart monitoring after a delay
        setTimeout(() => {
          console.log('Restarting Docker events monitoring...');
          this.startEventMonitoring(callback);
        }, 5000);
      });

      return eventsCommand;
    } catch (error) {
      console.error('Error starting Docker event monitoring:', error);
      return null;
    }
  }

  /**
   * Get recommendation based on event type
   */
  getRecommendation(action) {
    const recommendations = {
      'die': 'Check container logs immediately. Container may have crashed.',
      'kill': 'Container was forcefully terminated. Check what triggered the kill signal.',
      'oom': 'Container ran out of memory. Increase memory limits or optimize application.',
      'stop': 'Container was stopped. Check if this was intentional.',
      'pause': 'Container is paused. Resume when ready.',
      'restart': 'Container is restarting. Monitor for stability.',
    };
    
    return recommendations[action] || null;
  }
}

module.exports = DockerMonitor;
