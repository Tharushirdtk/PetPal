import client from './client';

export const submitContact = (data) => client.post('/contact', data);
