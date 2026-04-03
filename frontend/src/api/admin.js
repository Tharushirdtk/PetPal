import client from './client';

export const getStats = () => client.get('/admin/stats');

export const getQuestions = () => client.get('/admin/questions');

export const createQuestion = (data) => client.post('/admin/questions', data);

export const updateQuestion = (id, data) => client.put(`/admin/questions/${id}`, data);

export const deleteQuestion = (id) => client.delete(`/admin/questions/${id}`);

export const createVisibilityRule = (data) => client.post('/admin/visibility-rules', data);

export const updateVisibilityRule = (id, data) => client.put(`/admin/visibility-rules/${id}`, data);

export const deleteVisibilityRule = (id) => client.delete(`/admin/visibility-rules/${id}`);

export const getContacts = (params = {}) => client.get('/admin/contacts', { params });

export const updateContactStatus = (id, status) => client.put(`/admin/contacts/${id}`, { status });

export const getUsers = (params = {}) => client.get('/admin/users', { params });
