import client from './client';

export const login = (data) => client.post('/auth/login', data);
export const register = (data) => client.post('/auth/register', data);
export const logout = () => client.post('/auth/logout');
export const getMe = () => client.get('/auth/me');
export const updateProfile = (data) => client.put('/auth/profile', data);
export const changePassword = (data) => client.put('/auth/password', data);
