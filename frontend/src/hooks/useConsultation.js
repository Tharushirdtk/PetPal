import { useCallback } from 'react';
import { startConsultation as startApi } from '../api/consultation';
import { useConsultation } from '../context/ConsultationContext';

export function useStartConsultation() {
  const { startSession, setSelectedPetId } = useConsultation();

  const start = useCallback(async ({ pet_id, guest_handle } = {}) => {
    const body = {};
    if (pet_id) {
      body.pet_id = pet_id;
      setSelectedPetId(pet_id);
    }
    if (guest_handle) body.guest_handle = guest_handle;

    const res = await startApi(body);
    startSession(res.data);
    return res.data;
  }, [startSession, setSelectedPetId]);

  return { start };
}
