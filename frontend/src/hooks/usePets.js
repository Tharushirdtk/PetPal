import { useState, useEffect, useCallback } from 'react';
import { getMyPets, createPet as createPetApi, updatePet as updatePetApi, deletePet as deletePetApi } from '../api/pets';

export function usePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyPets();
      setPets(res.data.pets || []);
    } catch (err) {
      setError(err.error || 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const addPet = async (data) => {
    const res = await createPetApi(data);
    await fetchPets();
    return res.data.pet;
  };

  const editPet = async (id, data) => {
    const res = await updatePetApi(id, data);
    await fetchPets();
    return res.data.pet;
  };

  const removePet = async (id) => {
    await deletePetApi(id);
    await fetchPets();
  };

  return { pets, loading, error, refetch: fetchPets, addPet, editPet, removePet };
}
