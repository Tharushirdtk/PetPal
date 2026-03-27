import { createContext, useContext, useState, useCallback } from 'react';

const ConsultationContext = createContext(null);

export function ConsultationProvider({ children }) {
  const [consultationId, setConsultationId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(null);

  const startSession = useCallback((data) => {
    setConsultationId(data.consultation_id);
    setConversationId(data.conversation_id);
  }, []);

  const clearSession = useCallback(() => {
    setConsultationId(null);
    setConversationId(null);
    setSelectedPetId(null);
  }, []);

  return (
    <ConsultationContext.Provider value={{
      consultationId, conversationId, selectedPetId,
      setConsultationId, setConversationId, setSelectedPetId,
      startSession, clearSession,
    }}>
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const ctx = useContext(ConsultationContext);
  if (!ctx) throw new Error('useConsultation must be used within ConsultationProvider');
  return ctx;
}
