import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadImage, getImageStatus } from '../api/images';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageAssetId, setImageAssetId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const upload = useCallback(async (file, { consultation_id, pet_id } = {}) => {
    try {
      setUploading(true);
      setError(null);
      setAnalysis(null);
      setStatus('uploading');

      const formData = new FormData();
      formData.append('image', file);
      if (consultation_id) formData.append('consultation_id', consultation_id);
      if (pet_id) formData.append('pet_id', pet_id);

      const res = await uploadImage(formData);
      const assetId = res.data.image_asset_id;
      setImageAssetId(assetId);
      setStatus('queued');
      setUploading(false);

      // Poll for completion
      let elapsed = 0;
      pollRef.current = setInterval(async () => {
        elapsed += 2000;
        if (elapsed > 60000) { stopPolling(); setError('Analysis timed out'); return; }
        try {
          const statusRes = await getImageStatus(assetId);
          const data = statusRes.data;
          setStatus(data.status || data.image?.status);
          if (data.status === 'complete' || data.image?.status === 'complete') {
            setAnalysis(data.analysis || data);
            stopPolling();
          } else if (data.status === 'error' || data.image?.status === 'error') {
            setError('Image analysis failed');
            stopPolling();
          }
        } catch { /* keep polling */ }
      }, 2000);

      return assetId;
    } catch (err) {
      setUploading(false);
      setError(err.error || 'Upload failed');
      throw err;
    }
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setUploading(false);
    setImageAssetId(null);
    setAnalysis(null);
    setStatus(null);
    setError(null);
  }, [stopPolling]);

  return { upload, uploading, imageAssetId, analysis, status, error, reset };
}
