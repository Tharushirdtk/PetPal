import client from './client';

export const getActiveQuestionnaire = () => client.get('/questionnaire/active');
export const submitResponse = (data) => client.post('/questionnaire/response', data);
export const saveContext = (data) => client.post('/questionnaire/context', data);
