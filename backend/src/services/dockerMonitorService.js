const dockerService = require('./dockerService');

/**
 * Docker Monitor Service
 * Monitors Docker containers and system resources in real-time
 * Sends notifications for critical thresholds
 */

class DockerMonitorService {
  constructor() {
    this.thresholds = {
      cpu: {
        warning: 70, // 70%
        critical: 85, // 85%
      },
      memory: {
        warning: 75, // 75%
        critical: 90, // 90%
      },
      system: {
        cpuCritical: 90, // 90% total system CPU
        memoryCritical: 95, // 95% total system memory
      }
    };
    
    this.alertedContainers = new Map(); // Track which containers have been alerted
    this.systemAlerted = false;
  }

  /**
   * Parse percentage string to number
   */
  parsePercentage(percString) {
    if (!percString) return 0;
    return parseFloat(percString.replace('%', ''));
  }

  /**
   * Parse memory usage string (e.g., "1.5GiB / 8GiB")
   */
  parseMemoryUsage(memUsage) {
    if (!memUsage) return { used: 0, total: 0, percentage: 0 };
    
    const parts = memUsage.split('/').map(p => p.trim());
    if (parts.length !== 2) return { used: 0, total: 0, percentage: 0 };
    
    const parseSize = (sizeStr) => {
      const match = sizeStr.match(/^([\d.]+)([KMGT]i?B)$/i);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      
      const multipliers = {
        'B': 1,
        'KB': 1024, 'KIB': 1024,
        'MB': 1024 ** 2, 'MIB': 1024 ** 2,
        'GB': 1024 ** 3, 'GIB': 1024 ** 3,
        'TB': 1024 ** 4, 'TIB': 1024 ** 4,
      };
      
      return value * (multipliers[unit] || 1);
    };
    
    const used = parseSize(parts[0]);
    const total = parseSize(parts[1]);
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    return { used, total, percentage };
  }

  /**
   * Check if container stats exceed thresholds
   */
  checkContainerThresholds(containerStats) {
    const alerts = [];
    const containerId = containerStats.id;
    const containerName = containerStats.name;
    
    // Check CPU
    const cpuPerc = this.parsePercentage(containerStats.cpuPerc);
    if (cpuPerc >= this.thresholds.cpu.critical) {
      alerts.push({
        type: 'critical',
        category: 'cpu',
        containerId,
        containerName,
        message: `Container "${containerName}" CPU usage is CRITICAL: ${cpuPerc.toFixed(2)}%`,
        value: cpuPerc,
        threshold: this.thresholds.cpu.critical,
        timestamp: new Date().toISOString(),
      });
    } else if (cpuPerc >= this.thresholds.cpu.warning) {
      alerts.push({
        type: 'warning',
        category: 'cpu',
        containerId,
        containerName,
        message: `Container "${containerName}" CPU usage is high: ${cpuPerc.toFixed(2)}%`,
        value: cpuPerc,
        threshold: this.thresholds.cpu.warning,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Check Memory
    const memPerc = this.parsePercentage(containerStats.memPerc);
    if (memPerc >= this.thresholds.memory.critical) {
      alerts.push({
        type: 'critical',
        category: 'memory',
        containerId,
        containerName,
        message: `Container "${containerName}" Memory usage is CRITICAL: ${memPerc.toFixed(2)}%`,
        value: memPerc,
        threshold: this.thresholds.memory.critical,
        timestamp: new Date().toISOString(),
      });
    } else if (memPerc >= this.thresholds.memory.warning) {
      alerts.push({
        type: 'warning',
        category: 'memory',
        containerId,
        containerName,
        message: `Container "${containerName}" Memory usage is high: ${memPerc.toFixed(2)}%`,
        value: memPerc,
        threshold: this.thresholds.memory.warning,
        timestamp: new Date().toISOString(),
      });
    }
    
    return alerts;
  }

  /**
   * Check system-wide resource usage
   */
  async checkSystemThresholds(stats, systemInfo) {
    const alerts = [];
    
    // Calculate total CPU usage across all containers
    let totalCpuUsage = 0;
    let containerCount = 0;
    
    stats.forEach(stat => {
      if (!stat.error) {
        const cpuPerc = this.parsePercentage(stat.cpuPerc);
        totalCpuUsage += cpuPerc;
        containerCount++;
      }
    });
    
    // Average CPU across containers
    const avgCpuUsage = containerCount > 0 ? totalCpuUsage / containerCount : 0;
    
    // Check if system is under heavy load
    if (avgCpuUsage >= this.thresholds.system.cpuCritical) {
      alerts.push({
        type: 'critical',
        category: 'system',
        message: `SYSTEM ALERT: Average CPU usage across containers is CRITICAL: ${avgCpuUsage.toFixed(2)}%. System may become unstable!`,
        value: avgCpuUsage,
        threshold: this.thresholds.system.cpuCritical,
        timestamp: new Date().toISOString(),
        recommendation: 'Consider stopping non-essential containers or scaling resources.',
      });
    }
    
    // Calculate total memory usage
    let totalMemUsed = 0;
    let totalMemLimit = 0;
    
    stats.forEach(stat => {
      if (!stat.error && stat.memUsage) {
        const memInfo = this.parseMemoryUsage(stat.memUsage);
        totalMemUsed += memInfo.used;
        // Note: Container memory limit might not be system total
      }
    });
    
    // If systemInfo has memory info, check system memory
    if (systemInfo && systemInfo.memTotal) {
      const systemMemPerc = (totalMemUsed / systemInfo.memTotal) * 100;
      
      if (systemMemPerc >= this.thresholds.system.memoryCritical) {
        alerts.push({
          type: 'critical',
          category: 'system',
          message: `SYSTEM ALERT: System memory usage is CRITICAL: ${systemMemPerc.toFixed(2)}%. System may crash or become unresponsive!`,
          value: systemMemPerc,
          threshold: this.thresholds.system.memoryCritical,
          timestamp: new Date().toISOString(),
          recommendation: 'Immediate action required: Stop containers or increase system memory.',
        });
      }
    }
    
    return alerts;
  }

  /**
   * Should we send alert (avoid duplicate alerts)
   */
  shouldSendAlert(alert) {
    const key = `${alert.containerId || 'system'}_${alert.category}_${alert.type}`;
    const lastAlert = this.alertedContainers.get(key);
    
    // Send alert if:
    // 1. Never alerted before
    // 2. Last alert was more than 5 minutes ago (to avoid spam)
    // 3. Alert level escalated (warning -> critical)
    
    if (!lastAlert) {
      this.alertedContainers.set(key, {
        type: alert.type,
        timestamp: Date.now(),
      });
      return true;
    }
    
    const timeSinceLastAlert = Date.now() - lastAlert.timestamp;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeSinceLastAlert > fiveMinutes) {
      this.alertedContainers.set(key, {
        type: alert.type,
        timestamp: Date.now(),
      });
      return true;
    }
    
    // Alert level escalated
    if (lastAlert.type === 'warning' && alert.type === 'critical') {
      this.alertedContainers.set(key, {
        type: alert.type,
        timestamp: Date.now(),
      });
      return true;
    }
    
    return false;
  }

  /**
   * Monitor Docker stats and return alerts
   */
  async monitorStats() {
    try {
      const [stats, systemInfo] = await Promise.all([
        dockerService.getAllContainerStats(),
        dockerService.getSystemInfo().catch(() => null),
      ]);
      
      const allAlerts = [];
      
      // Check each container
      stats.forEach(stat => {
        if (!stat.error) {
          const containerAlerts = this.checkContainerThresholds(stat);
          containerAlerts.forEach(alert => {
            if (this.shouldSendAlert(alert)) {
              allAlerts.push(alert);
            }
          });
        }
      });
      
      // Check system-wide thresholds
      const systemAlerts = await this.checkSystemThresholds(stats, systemInfo);
      systemAlerts.forEach(alert => {
        if (this.shouldSendAlert(alert)) {
          allAlerts.push(alert);
        }
      });
      
      return {
        stats,
        systemInfo,
        alerts: allAlerts,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Error monitoring Docker stats:', error);
      throw error;
    }
  }

  /**
   * Get current thresholds
   */
  getThresholds() {
    return this.thresholds;
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Clear alert history (for testing or reset)
   */
  clearAlertHistory() {
    this.alertedContainers.clear();
    this.systemAlerted = false;
  }
}

module.exports = new DockerMonitorService();
