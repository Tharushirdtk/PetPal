import client from './client';

export const startConsultation = (data) => client.post('/consultations/start', data);
export const getConsultation = (id) => client.get(`/consultations/${id}`);
export const getConsultationHistory = () => client.get('/consultations/history');
export const getActiveConsultation = (petId) => client.get(`/consultations/active/${petId}`);
