import client from './client';

export const uploadImage = (formData) =>
  client.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

export const getImageStatus = (id) => client.get(`/images/${id}/status`);
export const getImageAnalysis = (id) => client.get(`/images/${id}/analysis`);
