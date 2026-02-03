import { get, post, put, patch } from './api';

// Get all servers with optional filters
export async function getAllServers(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.block) params.append('block', filters.block);
  if (filters.group) params.append('group', filters.group);
  
  const queryString = params.toString();
  const url = `/api/servers${queryString ? `?${queryString}` : ''}`;
  
  const { data } = await get(url);
  return data.data;
}

// Get server by ID
export async function getServerById(id) {
  const { data } = await get(`/api/servers/${id}`);
  return data.data;
}

// Create new server
export async function createServer(serverData) {
  const { data } = await post('/api/servers', serverData);
  return data;
}

// Update server
export async function updateServer(id, updateData) {
  const { data } = await put(`/api/servers/${id}`, updateData);
  return data;
}

// Deactivate server
export async function deactivateServer(id) {
  const { data } = await patch(`/api/servers/${id}/deactivate`);
  return data;
}

// Reactivate server
export async function reactivateServer(id) {
  const { data } = await patch(`/api/servers/${id}/reactivate`);
  return data;
}

// Import servers from Excel
export async function importServersFromExcel(file, skipDuplicates = false, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('skipDuplicates', skipDuplicates);
  
  const { data } = await post('/api/servers/import/excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  return data;
}
