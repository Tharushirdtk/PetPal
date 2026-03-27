import client from './client';

export const sendMessage = (data) => client.post('/chat/message', data);
export const getChatHistory = (consultationId) => client.get(`/chat/history/${consultationId}`);
