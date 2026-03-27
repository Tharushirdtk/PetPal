import client from './client';

export const getDiagnosis = (consultationId) => client.get(`/diagnosis/${consultationId}`);
