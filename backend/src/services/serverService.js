const Server = require('../models/Server');
const XLSX = require('xlsx');

class ServerService {
  // Get all servers with optional filtering
  async getAllServers(filters = {}) {
    try {
      const query = {};
      
      // Filter by status if provided
      if (filters.status) {
        query.status = filters.status;
      }
      
      // Filter by block if provided
      if (filters.block) {
        query.block = parseInt(filters.block);
      }
      
      // Filter by group if provided
      if (filters.group) {
        query.group = parseInt(filters.group);
      }

      const servers = await Server.find(query).sort({ block: 1, group: 1 });
      return servers;
    } catch (error) {
      throw new Error(`Error fetching servers: ${error.message}`);
    }
  }

  // Get server by ID
  async getServerById(id) {
    try {
      const server = await Server.findById(id);
      if (!server) {
        throw new Error('Server not found');
      }
      return server;
    } catch (error) {
      throw new Error(`Error fetching server: ${error.message}`);
    }
  }

  // Create new server
  async createServer(serverData) {
    try {
      // Check if server with same block and group already exists
      const existingServer = await Server.findOne({
        block: serverData.block,
        group: serverData.group,
        status: 'Active'
      });

      if (existingServer) {
        throw new Error(`Server with Block ${serverData.block} and Group ${serverData.group} already exists`);
      }

      const server = new Server(serverData);
      await server.save();
      return server;
    } catch (error) {
      throw new Error(`Error creating server: ${error.message}`);
    }
  }

  // Update server
  async updateServer(id, updateData) {
    try {
      // Don't allow updating to a block/group combination that already exists
      if (updateData.block || updateData.group) {
        const server = await Server.findById(id);
        const block = updateData.block || server.block;
        const group = updateData.group || server.group;

        const existingServer = await Server.findOne({
          _id: { $ne: id },
          block,
          group,
          status: 'Active'
        });

        if (existingServer) {
          throw new Error(`Server with Block ${block} and Group ${group} already exists`);
        }
      }

      const server = await Server.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!server) {
        throw new Error('Server not found');
      }

      return server;
    } catch (error) {
      throw new Error(`Error updating server: ${error.message}`);
    }
  }

  // Deactivate server (soft delete)
  async deactivateServer(id) {
    try {
      const server = await Server.findByIdAndUpdate(
        id,
        { $set: { status: 'Deactivated' } },
        { new: true }
      );

      if (!server) {
        throw new Error('Server not found');
      }

      return server;
    } catch (error) {
      throw new Error(`Error deactivating server: ${error.message}`);
    }
  }

  // Reactivate server
  async reactivateServer(id) {
    try {
      const server = await Server.findByIdAndUpdate(
        id,
        { $set: { status: 'Active' } },
        { new: true }
      );

      if (!server) {
        throw new Error('Server not found');
      }

      return server;
    } catch (error) {
      throw new Error(`Error reactivating server: ${error.message}`);
    }
  }

  // Import servers from Excel file
  async importServersFromExcel(filePath, skipDuplicates = false) {
    try {
      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        imported: []
      };

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Map Excel columns to database fields
          const serverData = {
            block: row['Block'],
            group: row['Group'],
            sshUser: row['SSH User'],
            sshHost: row['SSH Host'],
            sshPassword: row['SSH Password'],
            webHost: row['Web Host'],
            backendHost: row['Backend Host'],
            socketHost: row['Socket Host'],
            portsInsideDocker: row['Ports inside Docker'] || '3000 / 3001 / 3002',
            status: 'Active'
          };

          // Validate required fields
          if (!serverData.block || !serverData.group || !serverData.sshUser || 
              !serverData.sshHost || !serverData.sshPassword || !serverData.webHost ||
              !serverData.backendHost || !serverData.socketHost) {
            results.failed++;
            results.errors.push({
              row: i + 2, // Excel rows start at 1, header is row 1
              error: 'Missing required fields'
            });
            continue;
          }

          // Check if server already exists
          const existingServer = await Server.findOne({
            block: serverData.block,
            group: serverData.group
          });

          if (existingServer) {
            if (skipDuplicates) {
              // Skip this server if skipDuplicates is enabled
              results.skipped++;
              results.imported.push({
                block: serverData.block,
                group: serverData.group,
                action: 'skipped'
              });
            } else {
              // Update existing server
              await Server.findByIdAndUpdate(existingServer._id, serverData);
              results.success++;
              results.imported.push({
                block: serverData.block,
                group: serverData.group,
                action: 'updated'
              });
            }
          } else {
            // Create new server
            const server = new Server(serverData);
            await server.save();
            results.success++;
            results.imported.push({
              block: serverData.block,
              group: serverData.group,
              action: 'created'
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error importing servers from Excel: ${error.message}`);
    }
  }
}

module.exports = new ServerService();
