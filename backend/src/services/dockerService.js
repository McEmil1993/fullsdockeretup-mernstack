const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Docker Service
 * Handles Docker operations using docker CLI commands
 */

class DockerService {
  /**
   * Get all Docker images
   */
  async getAllImages() {
    try {
      const { stdout } = await execAsync('docker images --format "{{json .}}"');
      const lines = stdout.trim().split('\n').filter(line => line);
      const images = lines.map(line => {
        const img = JSON.parse(line);
        return {
          id: img.ID,
          repository: img.Repository,
          tag: img.Tag,
          size: img.Size,
          created: img.CreatedAt,
        };
      });
      return images;
    } catch (error) {
      console.error('Error getting Docker images:', error);
      throw new Error(`Failed to get Docker images: ${error.message}`);
    }
  }

  /**
   * Get all containers (running and stopped)
   */
  async getAllContainers() {
    try {
      const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');
      const lines = stdout.trim().split('\n').filter(line => line);
      const containers = lines.map(line => {
        const container = JSON.parse(line);
        return {
          id: container.ID,
          name: container.Names,
          image: container.Image,
          status: container.Status,
          state: container.State,
          ports: container.Ports,
          created: container.CreatedAt,
        };
      });
      return containers;
    } catch (error) {
      console.error('Error getting Docker containers:', error);
      throw new Error(`Failed to get Docker containers: ${error.message}`);
    }
  }

  /**
   * Get running containers only
   */
  async getRunningContainers() {
    try {
      const { stdout } = await execAsync('docker ps --format "{{json .}}"');
      const lines = stdout.trim().split('\n').filter(line => line);
      const containers = lines.map(line => {
        const container = JSON.parse(line);
        return {
          id: container.ID,
          name: container.Names,
          image: container.Image,
          status: container.Status,
          state: container.State,
          ports: container.Ports,
          created: container.CreatedAt,
        };
      });
      return containers;
    } catch (error) {
      console.error('Error getting running containers:', error);
      throw new Error(`Failed to get running containers: ${error.message}`);
    }
  }

  /**
   * Get container stats (CPU, Memory, Network)
   */
  async getContainerStats(containerId) {
    try {
      const { stdout } = await execAsync(
        `docker stats ${containerId} --no-stream --format "{{json .}}"`
      );
      const stats = JSON.parse(stdout.trim());
      return {
        id: stats.ID || stats.Container,
        name: stats.Name,
        cpuPerc: stats.CPUPerc,
        memUsage: stats.MemUsage,
        memPerc: stats.MemPerc,
        netIO: stats.NetIO,
        blockIO: stats.BlockIO,
        pids: stats.PIDs,
      };
    } catch (error) {
      console.error(`Error getting stats for container ${containerId}:`, error);
      throw new Error(`Failed to get container stats: ${error.message}`);
    }
  }

  /**
   * Get stats for all running containers
   */
  async getAllContainerStats() {
    try {
      const containers = await this.getRunningContainers();
      const statsPromises = containers.map(container =>
        this.getContainerStats(container.id).catch(err => ({
          id: container.id,
          name: container.name,
          error: err.message,
        }))
      );
      const stats = await Promise.all(statsPromises);
      return stats;
    } catch (error) {
      console.error('Error getting all container stats:', error);
      throw new Error(`Failed to get all container stats: ${error.message}`);
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(containerId, tail = 100) {
    try {
      const { stdout } = await execAsync(
        `docker logs ${containerId} --tail ${tail} 2>&1`
      );
      return stdout;
    } catch (error) {
      console.error(`Error getting logs for container ${containerId}:`, error);
      throw new Error(`Failed to get container logs: ${error.message}`);
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(containerId) {
    try {
      await execAsync(`docker restart ${containerId}`);
      return { success: true, message: 'Container restarted successfully' };
    } catch (error) {
      console.error(`Error restarting container ${containerId}:`, error);
      throw new Error(`Failed to restart container: ${error.message}`);
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(containerId) {
    try {
      await execAsync(`docker stop ${containerId}`);
      return { success: true, message: 'Container stopped successfully' };
    } catch (error) {
      console.error(`Error stopping container ${containerId}:`, error);
      throw new Error(`Failed to stop container: ${error.message}`);
    }
  }

  /**
   * Start a container
   */
  async startContainer(containerId) {
    try {
      await execAsync(`docker start ${containerId}`);
      return { success: true, message: 'Container started successfully' };
    } catch (error) {
      console.error(`Error starting container ${containerId}:`, error);
      throw new Error(`Failed to start container: ${error.message}`);
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId, force = false) {
    try {
      const forceFlag = force ? '-f' : '';
      await execAsync(`docker rm ${forceFlag} ${containerId}`);
      return { success: true, message: 'Container removed successfully' };
    } catch (error) {
      console.error(`Error removing container ${containerId}:`, error);
      throw new Error(`Failed to remove container: ${error.message}`);
    }
  }

  /**
   * Remove an image
   */
  async removeImage(imageId, force = false) {
    try {
      const forceFlag = force ? '-f' : '';
      await execAsync(`docker rmi ${forceFlag} ${imageId}`);
      return { success: true, message: 'Image removed successfully' };
    } catch (error) {
      console.error(`Error removing image ${imageId}:`, error);
      throw new Error(`Failed to remove image: ${error.message}`);
    }
  }

  /**
   * Remove unused images (dangling images)
   */
  async pruneImages() {
    try {
      const { stdout } = await execAsync('docker image prune -f');
      return { success: true, message: stdout };
    } catch (error) {
      console.error('Error pruning images:', error);
      throw new Error(`Failed to prune images: ${error.message}`);
    }
  }

  /**
   * Get Docker system info
   */
  async getSystemInfo() {
    try {
      const { stdout } = await execAsync('docker info --format "{{json .}}"');
      const info = JSON.parse(stdout);
      return {
        containers: info.Containers,
        containersRunning: info.ContainersRunning,
        containersPaused: info.ContainersPaused,
        containersStopped: info.ContainersStopped,
        images: info.Images,
        serverVersion: info.ServerVersion,
        memTotal: info.MemTotal,
        ncpu: info.NCPU,
        operatingSystem: info.OperatingSystem,
        architecture: info.Architecture,
      };
    } catch (error) {
      console.error('Error getting Docker system info:', error);
      throw new Error(`Failed to get Docker system info: ${error.message}`);
    }
  }

  /**
   * Get Docker disk usage
   */
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync('docker system df --format "{{json .}}"');
      const lines = stdout.trim().split('\n').filter(line => line);
      const usage = lines.map(line => JSON.parse(line));
      return usage;
    } catch (error) {
      console.error('Error getting Docker disk usage:', error);
      throw new Error(`Failed to get Docker disk usage: ${error.message}`);
    }
  }

  /**
   * Rebuild a container using docker-compose
   */
  async rebuildContainer(serviceName, composePath = './docker-setup') {
    try {
      const { stdout } = await execAsync(
        `cd ${composePath} && docker-compose up -d --build ${serviceName}`
      );
      return { success: true, message: 'Container rebuilt successfully', output: stdout };
    } catch (error) {
      console.error(`Error rebuilding container ${serviceName}:`, error);
      throw new Error(`Failed to rebuild container: ${error.message}`);
    }
  }

  /**
   * Get container inspect details
   */
  async inspectContainer(containerId) {
    try {
      const { stdout } = await execAsync(`docker inspect ${containerId}`);
      const details = JSON.parse(stdout);
      return details[0];
    } catch (error) {
      console.error(`Error inspecting container ${containerId}:`, error);
      throw new Error(`Failed to inspect container: ${error.message}`);
    }
  }

  /**
   * Get container bash history
   */
  async getContainerBashHistory(containerId) {
    try {
      console.log(`Fetching bash history for container: ${containerId}`);
      
      // Try multiple common locations for bash history
      const historyPaths = [
        '/root/.bash_history',
        '/home/*/.bash_history',
        '/.bash_history'
      ];
      
      let history = '';
      
      for (const path of historyPaths) {
        try {
          // Try to read the bash history file from the container
          const { stdout } = await execAsync(`docker exec ${containerId} sh -c "cat ${path} 2>/dev/null || echo ''"`);
          
          if (stdout && stdout.trim()) {
            history += stdout;
            console.log(`Found bash history at ${path}`);
          }
        } catch (error) {
          // Continue to next path if this one fails
          console.log(`No bash history found at ${path}`);
        }
      }
      
      if (!history || history.trim() === '') {
        // If no history found, try to find all .bash_history files
        try {
          const { stdout: findResult } = await execAsync(`docker exec ${containerId} find / -name .bash_history -type f 2>/dev/null | head -5`);
          
          if (findResult && findResult.trim()) {
            const files = findResult.trim().split('\n');
            console.log(`Found bash history files: ${files.join(', ')}`);
            
            for (const file of files) {
              try {
                const { stdout } = await execAsync(`docker exec ${containerId} cat "${file}" 2>/dev/null`);
                if (stdout && stdout.trim()) {
                  history += `\n# History from: ${file}\n${stdout}`;
                }
              } catch (e) {
                console.log(`Failed to read ${file}`);
              }
            }
          }
        } catch (error) {
          console.log('Failed to search for bash history files');
        }
      }
      
      if (!history || history.trim() === '') {
        return 'No bash history found.\n\nPossible reasons:\n- Container is not running\n- No bash shell has been used\n- History is not saved (.bash_history file not present)\n- Container uses a different shell (sh, zsh, etc.)\n\nTip: Students need to run commands in bash shell for history to be saved.';
      }
      
      // Format the history with line numbers (no leading spaces)
      const lines = history.trim().split('\n').filter(line => line.trim() !== '');
      const maxLineNum = String(lines.length).length;
      
      const formatted = lines
        .map((line, index) => `${String(index + 1).padStart(maxLineNum, ' ')} ${line}`)
        .join('\n');
      
      return `Bash Command History (${lines.length} commands)\n${'='.repeat(50)}\n${formatted}`;
      
    } catch (error) {
      console.error(`Error fetching bash history for container ${containerId}:`, error);
      
      if (error.message.includes('is not running')) {
        return 'Cannot read bash history: Container is not running.\n\nPlease start the container first.';
      }
      
      throw new Error(`Failed to fetch bash history: ${error.message}`);
    }
  }

  /**
   * Recreate container (stop, remove, and recreate with same image and settings)
   */
  async recreateContainer(containerId) {
    try {
      // Step 1: Get container details before removing
      const containerDetails = await this.inspectContainer(containerId);
      const containerName = containerDetails.Name.replace(/^\//, ''); // Remove leading slash
      const imageName = containerDetails.Config.Image;
      const env = containerDetails.Config.Env || [];
      const ports = containerDetails.HostConfig.PortBindings || {};
      const volumes = containerDetails.HostConfig.Binds || [];
      const networkMode = containerDetails.HostConfig.NetworkMode || 'bridge';
      const restartPolicy = containerDetails.HostConfig.RestartPolicy?.Name || 'no';
      
      console.log(`Recreating container: ${containerName} with image: ${imageName}`);

      // Step 2: Stop the container if running
      if (containerDetails.State.Running) {
        console.log(`Stopping container: ${containerName}`);
        await execAsync(`docker stop ${containerId}`);
      }

      // Step 3: Remove the container
      console.log(`Removing container: ${containerName}`);
      await execAsync(`docker rm ${containerId}`);

      // Step 4: Build docker run command with same settings
      let runCommand = `docker run -d --name ${containerName}`;
      
      // Add restart policy
      if (restartPolicy && restartPolicy !== 'no') {
        runCommand += ` --restart ${restartPolicy}`;
      }
      
      // Add network mode
      if (networkMode && networkMode !== 'default') {
        runCommand += ` --network ${networkMode}`;
      }
      
      // Add environment variables
      env.forEach(envVar => {
        runCommand += ` -e "${envVar}"`;
      });
      
      // Add port mappings
      Object.keys(ports).forEach(containerPort => {
        const hostBinding = ports[containerPort];
        if (hostBinding && hostBinding.length > 0) {
          const hostPort = hostBinding[0].HostPort;
          if (hostPort) {
            runCommand += ` -p ${hostPort}:${containerPort.split('/')[0]}`;
          }
        }
      });
      
      // Add volume bindings
      volumes.forEach(volume => {
        runCommand += ` -v "${volume}"`;
      });
      
      // Add image name
      runCommand += ` ${imageName}`;
      
      console.log(`Executing recreate command: ${runCommand}`);

      // Step 5: Create new container with same configuration
      const { stdout } = await execAsync(runCommand);
      const newContainerId = stdout.trim();
      
      console.log(`Container recreated successfully with ID: ${newContainerId}`);

      return {
        message: `Container ${containerName} recreated successfully`,
        newContainer: {
          id: newContainerId,
          name: containerName,
          image: imageName
        }
      };
    } catch (error) {
      console.error(`Error recreating container ${containerId}:`, error);
      throw new Error(`Failed to recreate container: ${error.message}`);
    }
  }
}

module.exports = new DockerService();
