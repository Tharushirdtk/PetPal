const PYTHON_SIDECAR_URL = process.env.PYTHON_SIDECAR_URL || 'http://localhost:5001';

/**
 * Run inference on an image using the Python sidecar
 * which hosts the TF/Keras .h5 model.
 *
 * @param {string} imagePath - Absolute path to the image file
 * @param {string} [species] - Pet species ("Dog" or "Cat") to filter predictions
 * @returns {{ prediction_text: string, confidence_percent: number, top_label: string }}
 */
async function runInference(imagePath, species) {
  const body = { image_path: imagePath };
  if (species) body.species = species;

  const response = await fetch(`${PYTHON_SIDECAR_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Image model sidecar error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  return {
    prediction_text: data.prediction_text,
    confidence_percent: data.confidence_percent,
    top_label: data.top_label,
    raw_result: data,
    confidence_level: data.confidence_level || 'unknown',
    is_uncertain: data.is_uncertain || false,
    prediction_note: data.prediction_note || null,
    top5: data.top5 || [],
  };
}

module.exports = { runInference };
