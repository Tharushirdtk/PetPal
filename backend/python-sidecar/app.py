import os
import json
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

# ──────────────────────────────────────────────
#  Class labels for the 22-class skin model
# ──────────────────────────────────────────────
CLASS_LABELS = {
    0: "Dental Disease in Cat",
    1: "Dental Disease in Dog",
    2: "Distemper in Dog",
    3: "Ear Mites in Cat",
    4: "Eye Infection in Cat",
    5: "Eye Infection in Dog",
    6: "Feline Leukemia",
    7: "Feline Panleukopenia",
    8: "Fungal Infection in Cat",
    9: "Fungal Infection in Dog",
    10: "Hot Spots in Dog",
    11: "Kennel Cough in Dog",
    12: "Mange in Dog",
    13: "Parvovirus in Dog",
    14: "Ringworm in Cat",
    15: "Scabies in Cat",
    16: "Skin Allergy in Cat",
    17: "Skin Allergy in Dog",
    18: "Tick Infestation in Dog",
    19: "Urinary Tract Infection in Cat",
    20: "Worm Infection in Cat",
    21: "Worm Infection in Dog",
}

# ──────────────────────────────────────────────
#  Load model and embedding model once at startup
# ──────────────────────────────────────────────
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "..", "petpal_skin_model.h5")
)

print(f"Loading TF model from: {MODEL_PATH}")
tf_model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("TF model loaded successfully")

print("Loading sentence-transformer embedding model...")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedding model loaded successfully")

INPUT_SIZE = (224, 224)


def preprocess_image(image_path):
    """Load, resize, and normalize an image for inference."""
    img = Image.open(image_path).convert("RGB")
    img = img.resize(INPUT_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


# ──────────────────────────────────────────────
#  /predict  — image classification endpoint
# ──────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    image_path = data.get("image_path")

    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": f"Image file not found: {image_path}"}), 400

    try:
        tensor = preprocess_image(image_path)
        predictions = tf_model.predict(tensor, verbose=0)[0]

        top_index = int(np.argmax(predictions))
        confidence = float(predictions[top_index])
        confidence_percent = round(confidence * 100, 2)
        top_label = CLASS_LABELS.get(top_index, f"class_{top_index}")

        # Build top-5 for raw result
        top5_indices = np.argsort(predictions)[::-1][:5]
        top5 = [
            {
                "label": CLASS_LABELS.get(int(i), f"class_{i}"),
                "confidence": round(float(predictions[i]) * 100, 2),
            }
            for i in top5_indices
        ]

        return jsonify({
            "prediction_text": top_label,
            "confidence_percent": confidence_percent,
            "top_label": top_label.lower().replace(" ", "_"),
            "top5": top5,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
#  /embed  — sentence embedding endpoint
# ──────────────────────────────────────────────
@app.route("/embed", methods=["POST"])
def embed():
    data = request.get_json(force=True)
    texts = data.get("texts", [])

    if not texts or not isinstance(texts, list):
        return jsonify({"error": "texts must be a non-empty list of strings"}), 400

    try:
        embeddings = embed_model.encode(texts, convert_to_numpy=True)
        return jsonify({"embeddings": embeddings.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
#  Health check
# ──────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_classes": len(CLASS_LABELS)})


if __name__ == "__main__":
    port = int(os.environ.get("SIDECAR_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
