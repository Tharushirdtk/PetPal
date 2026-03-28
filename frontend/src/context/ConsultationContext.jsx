import { createContext, useContext, useState, useCallback } from 'react';

const ConsultationContext = createContext(null);

/* Persist to sessionStorage so a page refresh doesn't lose the active consultation */
const STORAGE_KEY = 'petpal_consultation';

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function ConsultationProvider({ children }) {
  const saved = loadFromSession();
  const [consultationId, setConsultationId] = useState(saved.consultation_id || null);
  const [conversationId, setConversationId] = useState(saved.conversation_id || null);
  const [selectedPetId, setSelectedPetId] = useState(saved.pet_id || null);
  const [petInfo, setPetInfo] = useState(saved.pet_info || null);

  const startSession = useCallback((data) => {
    setConsultationId(data.consultation_id);
    setConversationId(data.conversation_id);
    const current = loadFromSession();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...current,
      consultation_id: data.consultation_id,
      conversation_id: data.conversation_id,
      pet_id: data.pet_id || current.pet_id || null,
    }));
  }, []);

  const savePetInfo = useCallback((info) => {
    setPetInfo(info);
    const current = loadFromSession();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, pet_info: info }));
  }, []);

  const clearSession = useCallback(() => {
    setConsultationId(null);
    setConversationId(null);
    setSelectedPetId(null);
    setPetInfo(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ConsultationContext.Provider value={{
      consultationId, conversationId, selectedPetId, petInfo,
      setConsultationId, setConversationId, setSelectedPetId, savePetInfo,
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
