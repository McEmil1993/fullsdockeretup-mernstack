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
   * Completely delete a container with all its volumes and files
   * This will stop, remove container, remove volumes, and delete the directory
   */
  async deleteContainerCompletely(containerId) {
    try {
      console.log(`Starting complete deletion of container: ${containerId}`);
      
      // Step 1: Get container details before removing
      const containerDetails = await this.inspectContainer(containerId);
      const containerName = containerDetails.Name.replace(/^\//, ''); // Remove leading slash
      const imageName = containerDetails.Config.Image;
      const volumes = containerDetails.Mounts || [];
      
      console.log(`Container name: ${containerName}`);
      console.log(`Image: ${imageName}`);
      console.log(`Volumes: ${volumes.length}`);

      // Step 2: Stop the container if running
      if (containerDetails.State.Running) {
        console.log(`Stopping container: ${containerName}`);
        await execAsync(`docker stop ${containerId}`);
      }

      // Step 3: Remove the container with volumes
      console.log(`Removing container with volumes: ${containerName}`);
      await execAsync(`docker rm -f -v ${containerId}`);

      // Step 4: Extract the service name from container name
      // Example: macneil-server-container -> macneil
      let serviceName = containerName;
      if (containerName.endsWith('-server-container')) {
        serviceName = containerName.replace('-server-container', '');
      } else if (containerName.endsWith('-container')) {
        serviceName = containerName.replace('-container', '');
      } else if (containerName.endsWith('-server')) {
        serviceName = containerName.replace('-server', '');
      }

      console.log(`Service name extracted: ${serviceName}`);

      // Step 5: Remove the directory and files
      const containerDir = `./docker-setup/${serviceName}`;
      try {
        console.log(`Removing directory: ${containerDir}`);
        await execAsync(`rm -rf ${containerDir}`);
        console.log(`Directory removed successfully`);
      } catch (dirError) {
        console.warn(`Warning: Could not remove directory ${containerDir}: ${dirError.message}`);
      }

      // Step 6: Remove from docker-compose.yml
      const composeFilePath = './docker-setup/docker-compose.yml';
      try {
        console.log(`Updating docker-compose.yml`);
        const fs = require('fs');
        const composeContent = fs.readFileSync(composeFilePath, 'utf8');
        
        // Split content into lines for better parsing
        const lines = composeContent.split('\n');
        const newLines = [];
        let skipMode = false;
        let serviceIndent = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check if this line starts the service we want to delete
          // Match both "serviceName-server:" or "  serviceName-server:"
          const serviceMatch = line.match(/^(\s*)([a-z0-9-]+):\s*$/);
          
          if (serviceMatch) {
            const indent = serviceMatch[1].length;
            const currentServiceName = serviceMatch[2];
            
            // Check if this is the service we want to delete
            if (currentServiceName === `${serviceName}-server`) {
              console.log(`Found service to delete: ${currentServiceName} at line ${i + 1}`);
              skipMode = true;
              serviceIndent = indent;
              continue; // Skip this line
            } else if (skipMode && indent <= serviceIndent) {
              // We've reached the next service at the same or lower indent level
              console.log(`End of service section at line ${i + 1}`);
              skipMode = false;
            }
          }
          
          // Skip lines if we're in skip mode
          if (skipMode) {
            // Check if we've reached a line with same or less indentation than the service
            // This indicates we've moved to the next section
            if (line.trim() && !line.startsWith(' '.repeat(serviceIndent + 1))) {
              const currentIndent = line.length - line.trimStart().length;
              if (currentIndent <= serviceIndent) {
                skipMode = false;
              }
            }
            
            if (skipMode) {
              continue; // Skip this line
            }
          }
          
          // Keep this line
          newLines.push(line);
        }
        
        // Write updated content back to file
        const updatedCompose = newLines.join('\n');
        fs.writeFileSync(composeFilePath, updatedCompose, 'utf8');
        console.log(`Successfully removed service from docker-compose.yml`);
        
      } catch (composeError) {
        console.warn(`Warning: Could not update docker-compose.yml: ${composeError.message}`);
      }

      // Step 7: Remove the image if no other containers are using it
      try {
        console.log(`Checking if image can be removed: ${imageName}`);
        const { stdout: containersUsingImage } = await execAsync(
          `docker ps -a --filter ancestor=${imageName} --format "{{.ID}}"`
        );
        
        if (!containersUsingImage.trim()) {
          console.log(`No other containers using image, removing: ${imageName}`);
          await execAsync(`docker rmi -f ${imageName}`);
          console.log(`Image removed successfully`);
        } else {
          console.log(`Image still in use by other containers, skipping removal`);
        }
      } catch (imageError) {
        console.warn(`Warning: Could not remove image: ${imageError.message}`);
      }

      // Step 8: Remove orphaned volumes
      try {
        console.log(`Removing orphaned volumes`);
        await execAsync(`docker volume prune -f`);
        console.log(`Orphaned volumes removed`);
      } catch (volumeError) {
        console.warn(`Warning: Could not prune volumes: ${volumeError.message}`);
      }

      // Step 9: Delete from servers table if exists
      try {
        const Server = require('../models/Server');
        
        // Try to find and delete server record by SSH host containing container name or service name
        const deletedServers = await Server.deleteMany({
          $or: [
            { sshHost: { $regex: serviceName, $options: 'i' } },
            { sshHost: { $regex: containerName, $options: 'i' } }
          ]
        });
        
        if (deletedServers.deletedCount > 0) {
          console.log(`Deleted ${deletedServers.deletedCount} server record(s) from database`);
        }
      } catch (dbError) {
        console.warn(`Warning: Could not delete from servers table: ${dbError.message}`);
      }

      console.log(`Complete deletion finished for: ${containerName}`);

      return {
        success: true,
        message: `Container ${containerName} and all associated data deleted completely`,
        deleted: {
          container: containerName,
          serviceName: serviceName,
          image: imageName,
          directory: containerDir,
          volumes: volumes.length
        }
      };

    } catch (error) {
      console.error(`Error completely deleting container ${containerId}:`, error);
      throw new Error(`Failed to completely delete container: ${error.message}`);
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
   * Get all used ports from all containers
   */
  async getUsedPorts() {
    try {
      const containers = await this.getAllContainers();
      const usedPorts = new Set();
      
      containers.forEach(container => {
        // Parse ports string like "0.0.0.0:2090->22/tcp, 0.0.0.0:5833->3000/tcp"
        if (container.ports) {
          const portMappings = container.ports.split(',');
          portMappings.forEach(mapping => {
            const match = mapping.trim().match(/0\.0\.0\.0:(\d+)->/);
            if (match) {
              usedPorts.add(parseInt(match[1]));
            }
          });
        }
      });
      
      return Array.from(usedPorts).sort((a, b) => a - b);
    } catch (error) {
      console.error('Error getting used ports:', error);
      throw new Error(`Failed to get used ports: ${error.message}`);
    }
  }

  /**
   * Check if container name already exists
   */
  async checkContainerNameExists(name) {
    try {
      const containers = await this.getAllContainers();
      return containers.some(c => c.name === name || c.name === `/${name}`);
    } catch (error) {
      console.error('Error checking container name:', error);
      throw new Error(`Failed to check container name: ${error.message}`);
    }
  }

  /**
   * Check if ports are available
   */
  async checkPortsAvailable(ports) {
    try {
      const usedPorts = await this.getUsedPorts();
      const unavailablePorts = [];
      
      ports.forEach(port => {
        if (usedPorts.includes(parseInt(port))) {
          unavailablePorts.push(port);
        }
      });
      
      return {
        available: unavailablePorts.length === 0,
        unavailablePorts
      };
    } catch (error) {
      console.error('Error checking ports availability:', error);
      throw new Error(`Failed to check ports availability: ${error.message}`);
    }
  }

  /**
   * Create a new Docker container with custom configuration
   */
  async createCustomContainer(config) {
    try {
      const { name, os, user, password, portsInside, portsOutside } = config;
      
      // Validate required fields
      if (!name || !os || !user || !password || !portsInside || !portsOutside) {
        throw new Error('Missing required fields');
      }

      // Validate Windows containers on Linux host
      const osType = this.detectOSType(os);
      if (osType === 'windows') {
        // Check if Docker host is Windows
        try {
          const { stdout: dockerOSType } = await execAsync('docker info --format "{{.OSType}}"');
          const hostOS = dockerOSType.trim().toLowerCase();
          
          if (hostOS !== 'windows') {
            throw new Error(
              `Windows containers are not supported on ${hostOS} Docker host. ` +
              `Windows containers require a Windows Docker host (Windows 10/11 Pro or Windows Server). ` +
              `Please use a Linux-based container image instead.`
            );
          }
        } catch (error) {
          if (error.message.includes('not supported')) {
            throw error; // Re-throw our custom error
          }
          console.warn('Could not detect Docker host OS type:', error.message);
        }
      }

      // Check if container name already exists
      const nameExists = await this.checkContainerNameExists(name);
      if (nameExists) {
        throw new Error(`Container name "${name}" already exists`);
      }

      // Parse ports
      const insidePorts = portsInside.split(',').map(p => p.trim());
      const outsidePorts = portsOutside.split(',').map(p => p.trim());
      
      if (insidePorts.length !== outsidePorts.length) {
        throw new Error('Number of inside ports must match outside ports');
      }

      // Check if outside ports are available
      const portCheck = await this.checkPortsAvailable(outsidePorts);
      if (!portCheck.available) {
        throw new Error(`Ports already in use: ${portCheck.unavailablePorts.join(', ')}`);
      }

      // Create directory for the new container
      const containerDir = `./docker-setup/${name}`;
      await execAsync(`mkdir -p ${containerDir}/data`);

      // Generate Dockerfile
      const dockerfile = this.generateDockerfile(os, user, password, insidePorts);
      await execAsync(`echo '${dockerfile.replace(/'/g, "'\\''")}' > ${containerDir}/Dockerfile`);

      // Generate docker-compose.yml entry (we'll add to existing file)
      const portMappings = outsidePorts.map((out, idx) => `      - "${out}:${insidePorts[idx]}"`).join('\n');
      
      const composeService = `
  ${name}-server:
    build: ./${name}
    image: ${name}-server
    container_name: ${name}-server-container
    tty: true
    stdin_open: true
    restart: unless-stopped
    ports:
${portMappings}
    volumes:
      - ./${name}/data:/data
`;

      // Read existing docker-compose.yml
      const composeFilePath = './docker-setup/docker-compose.yml';
      let existingCompose = '';
      try {
        const { stdout } = await execAsync(`cat ${composeFilePath}`);
        existingCompose = stdout;
      } catch (e) {
        // If file doesn't exist, create a basic structure
        existingCompose = 'version: "3.9"\n\nservices:';
      }

      // Add new service to docker-compose.yml
      const updatedCompose = existingCompose.trimEnd() + composeService;
      await execAsync(`echo '${updatedCompose.replace(/'/g, "'\\''")}' > ${composeFilePath}`);

      // Build and start the container
      console.log(`Building and starting container: ${name}`);
      
      // Try docker compose (v2) first, fallback to docker-compose (v1)
      let stdout;
      let composeCommand = '';
      
      try {
        // Try docker compose v2
        composeCommand = `cd docker-setup && docker compose up -d --build ${name}-server`;
        console.log(`Executing: ${composeCommand}`);
        const result = await execAsync(composeCommand);
        stdout = result.stdout;
        console.log(`Successfully built with docker compose v2`);
      } catch (composeError) {
        console.log(`Docker compose v2 failed: ${composeError.message}`);
        
        try {
          // Fallback to docker-compose v1
          composeCommand = `cd docker-setup && docker-compose up -d --build ${name}-server`;
          console.log(`Trying docker-compose v1: ${composeCommand}`);
          const result = await execAsync(composeCommand);
          stdout = result.stdout;
          console.log(`Successfully built with docker-compose v1`);
        } catch (composev1Error) {
          console.error(`Docker-compose v1 also failed: ${composev1Error.message}`);
          
          // Both failed, provide helpful error message
          throw new Error(
            `Failed to build container with docker compose. ` +
            `Error: ${composeError.message}. ` +
            `Please ensure Docker Compose is installed and the Dockerfile is valid. ` +
            `Check the generated Dockerfile at: docker-setup/${name}/Dockerfile`
          );
        }
      }

      console.log(`Container ${name} created successfully`);

      return {
        success: true,
        message: `Container ${name} created and started successfully`,
        output: stdout,
        containerName: `${name}-server-container`,
        ports: portsOutside,
        portsInside: insidePorts
      };

    } catch (error) {
      console.error('Error creating custom container:', error);
      throw new Error(`Failed to create container: ${error.message}`);
    }
  }

  /**
   * Detect OS type from image name
   */
  detectOSType(os) {
    const osLower = os.toLowerCase();
    
    // Windows containers
    if (osLower.includes('windows') || osLower.includes('mcr.microsoft.com')) {
      return 'windows';
    }
    
    // BusyBox / Minimal systems
    if (osLower.includes('busybox') || osLower.includes('tinycore')) {
      return 'busybox';
    }
    
    // Debian-based
    if (osLower.includes('ubuntu') || osLower.includes('debian') || 
        osLower.includes('kali') || osLower.includes('parrot') || 
        osLower.includes('mint') || osLower.includes('mx') || 
        osLower.includes('pure') || osLower.includes('devuan')) {
      return 'debian';
    }
    
    // RedHat-based
    if (osLower.includes('centos') || osLower.includes('rocky') || 
        osLower.includes('alma') || osLower.includes('fedora') || 
        osLower.includes('oracle') || osLower.includes('amazon') ||
        osLower.includes('rhel') || osLower.includes('redhat') ||
        osLower.includes('ubi') || osLower.includes('clearos')) {
      return 'redhat';
    }
    
    // Alpine
    if (osLower.includes('alpine')) {
      return 'alpine';
    }
    
    // Arch-based
    if (osLower.includes('arch') || osLower.includes('manjaro') ||
        osLower.includes('endeavour') || osLower.includes('garuda') ||
        osLower.includes('arco') || osLower.includes('artix') ||
        osLower.includes('blackarch')) {
      return 'arch';
    }
    
    // SUSE-based
    if (osLower.includes('opensuse') || osLower.includes('suse') ||
        osLower.includes('leap') || osLower.includes('tumbleweed')) {
      return 'suse';
    }
    
    // Gentoo-based
    if (osLower.includes('gentoo') || osLower.includes('calculate')) {
      return 'gentoo';
    }
    
    // Slackware-based
    if (osLower.includes('slackware') || osLower.includes('salix')) {
      return 'slackware';
    }
    
    // Void Linux
    if (osLower.includes('void')) {
      return 'void';
    }
    
    // NixOS
    if (osLower.includes('nix')) {
      return 'nixos';
    }
    
    // Special systems
    if (osLower.includes('clear') && osLower.includes('linux')) {
      return 'debian'; // Clear Linux uses swupd but fallback to debian
    }
    
    if (osLower.includes('mageia') || osLower.includes('mandriva')) {
      return 'redhat'; // Mageia/OpenMandriva use urpmi but similar to RPM-based
    }
    
    // Default to debian-based
    return 'debian';
  }

  /**
   * Generate Dockerfile content based on configuration
   */
  generateDockerfile(os, user, password, ports) {
    const exposePorts = ports.join(' ');
    const osType = this.detectOSType(os);
    const fs = require('fs');
    const path = require('path');
    
    // Use OS-specific template if available
    const templatePath = path.join(__dirname, '../../docker-setup/dockerfile-templates', `Dockerfile.${osType}`);
    
    if (fs.existsSync(templatePath)) {
      console.log(`Using template: ${templatePath}`);
      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Replace ARG BASE_IMAGE with actual FROM
      template = template.replace(/ARG BASE_IMAGE\nFROM \${BASE_IMAGE}/, `FROM ${os}`);
      
      // Replace admin123 password with actual password
      template = template.replace(/admin123/g, password);
      
      // Update EXPOSE ports
      template = template.replace(/EXPOSE 22/, `EXPOSE ${exposePorts}`);
      
      return template;
    }
    
    console.log(`No template found for ${osType}, using legacy generator`);
    
    // Fallback to legacy inline generator
    let dockerfile = `FROM ${os}\n\n`;
    
    // OS-specific installation commands
    if (osType === 'windows') {
      // Windows container
      dockerfile += `# Set PowerShell as default shell
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

# Install OpenSSH Server
RUN Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0; \\
    Set-Service -Name sshd -StartupType 'Automatic'; \\
    New-ItemProperty -Path "HKLM:\\SOFTWARE\\OpenSSH" -Name DefaultShell -Value "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -PropertyType String -Force

# Set administrator password
RUN net user Administrator ${password}

# Configure SSH to allow password authentication
RUN $sshdConfigPath = 'C:\\ProgramData\\ssh\\sshd_config'; \\
    if (Test-Path $sshdConfigPath) { \\
        (Get-Content $sshdConfigPath) -replace '#PasswordAuthentication yes', 'PasswordAuthentication yes' | Set-Content $sshdConfigPath; \\
        (Get-Content $sshdConfigPath) -replace 'PasswordAuthentication no', 'PasswordAuthentication yes' | Set-Content $sshdConfigPath; \\
    }

EXPOSE ${exposePorts}

# Start SSH service
CMD ["powershell", "-Command", "Start-Service sshd; while ($true) { Start-Sleep -Seconds 3600 }"]
`;
    } else if (osType === 'debian') {
      dockerfile += `ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \\
    openssh-server \\
    sudo \\
    curl \\
    nano \\
    vim \\
    net-tools \\
    iputils-ping \\
    && apt-get clean \\
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/run/sshd

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'redhat') {
      dockerfile += `RUN yum update -y && yum install -y \\
    openssh-server \\
    sudo \\
    curl \\
    nano \\
    vim \\
    net-tools \\
    iputils \\
    iproute \\
    && yum clean all

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'alpine') {
      dockerfile += `RUN apk add --no-cache \\
    openssh \\
    sudo \\
    curl \\
    nano \\
    vim \\
    net-tools \\
    iputils \\
    bash

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'arch') {
      dockerfile += `RUN pacman-key --init && \\
    pacman -Sy --noconfirm archlinux-keyring && \\
    pacman -Syu --noconfirm openssh sudo curl nano vim net-tools iputils iproute2 && \\
    pacman -Scc --noconfirm

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'suse') {
      dockerfile += `RUN zypper refresh && zypper install -y \\
    openssh \\
    sudo \\
    curl \\
    nano \\
    vim \\
    net-tools \\
    iputils

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'gentoo') {
      dockerfile += `RUN emerge --sync && \\
    emerge --quiet net-misc/openssh app-admin/sudo net-misc/curl app-editors/nano app-editors/vim net-misc/iputils && \\
    rc-update add sshd default

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'slackware') {
      dockerfile += `RUN slackpkg update && \\
    slackpkg install -default_answer=y openssh sudo curl nano vim iputils || \\
    echo "OpenSSH may already be installed"

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'void') {
      dockerfile += `RUN xbps-install -Syu && \\
    xbps-install -y openssh sudo curl nano vim iputils iproute2

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'nixos') {
      dockerfile += `RUN nix-channel --update && \\
    nix-env -iA nixpkgs.openssh nixpkgs.sudo nixpkgs.curl nixpkgs.nano nixpkgs.vim nixpkgs.iputils

RUN ssh-keygen -A

# Set root password
RUN echo 'root:${password}' | chpasswd

# Enable root login and password auth
RUN mkdir -p /etc/ssh && \\
    (sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config || \\
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config)

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config || \\
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

EXPOSE ${exposePorts}

CMD ["/usr/sbin/sshd", "-D"]
`;
    } else if (osType === 'busybox') {
      dockerfile += `# Note: BusyBox has very limited package management
# Try to install dropbear (lightweight SSH) if available
RUN if command -v apk >/dev/null 2>&1; then \\
        apk add --no-cache dropbear; \\
    elif command -v apt-get >/dev/null 2>&1; then \\
        apt-get update && apt-get install -y dropbear; \\
    else \\
        echo "No package manager found. SSH not available."; \\
    fi

# Set root password
RUN echo 'root:${password}' | chpasswd 2>/dev/null || echo "Note: chpasswd may not be available"

EXPOSE ${exposePorts}

# Try to start dropbear or just keep container alive
CMD if command -v dropbear >/dev/null 2>&1; then \\
        dropbear -FEmwg -p 22; \\
    else \\
        echo "SSH not available. Use 'docker exec' to access this container."; \\
        tail -f /dev/null; \\
    fi
`;
    }
    
    return dockerfile;
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
