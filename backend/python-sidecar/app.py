import os
import json
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image, ImageEnhance
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

# Indices belonging to each species (for species-aware filtering)
DOG_INDICES = [i for i, lbl in CLASS_LABELS.items() if "Dog" in lbl]
CAT_INDICES = [i for i, lbl in CLASS_LABELS.items() if "Cat" in lbl or "Feline" in lbl]

# ──────────────────────────────────────────────
#  Confidence thresholds
# ──────────────────────────────────────────────
HIGH_CONFIDENCE = 0.60
MODERATE_CONFIDENCE = 0.35

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


def create_augmented_tensors(image_path):
    """Create augmented versions of an image for test-time augmentation."""
    img = Image.open(image_path).convert("RGB").resize(INPUT_SIZE)

    augmented = []

    # 1. Horizontal flip
    augmented.append(img.transpose(Image.FLIP_LEFT_RIGHT))

    # 2. Rotation +15 degrees
    augmented.append(img.rotate(-15, resample=Image.BILINEAR, fillcolor=(0, 0, 0)))

    # 3. Rotation -15 degrees
    augmented.append(img.rotate(15, resample=Image.BILINEAR, fillcolor=(0, 0, 0)))

    # 4. Brightness increase (+20%)
    enhancer = ImageEnhance.Brightness(img)
    augmented.append(enhancer.enhance(1.2))

    # Convert all to normalized arrays
    tensors = []
    for aug_img in augmented:
        arr = np.array(aug_img, dtype=np.float32) / 255.0
        tensors.append(arr)

    return np.array(tensors)  # shape: (4, 224, 224, 3)


def apply_species_filter(predictions, species):
    """Zero out predictions for the wrong species and re-normalize."""
    if species == "dog":
        filtered = predictions.copy()
        for i in CAT_INDICES:
            filtered[i] = 0.0
    elif species == "cat":
        filtered = predictions.copy()
        for i in DOG_INDICES:
            filtered[i] = 0.0
    else:
        return predictions

    total = filtered.sum()
    if total > 0:
        filtered = filtered / total
    return filtered


def get_confidence_level(confidence):
    """Classify confidence into high/moderate/low."""
    if confidence >= HIGH_CONFIDENCE:
        return "high"
    elif confidence >= MODERATE_CONFIDENCE:
        return "moderate"
    return "low"


def build_response(filtered, tta_applied=False):
    """Build the full prediction response from filtered probabilities."""
    top_index = int(np.argmax(filtered))
    confidence = float(filtered[top_index])
    confidence_percent = round(confidence * 100, 2)
    top_label = CLASS_LABELS.get(top_index, f"class_{top_index}")

    # Top-5 predictions
    top5_indices = np.argsort(filtered)[::-1][:5]
    top5 = [
        {
            "label": CLASS_LABELS.get(int(i), f"class_{i}"),
            "confidence": round(float(filtered[i]) * 100, 2),
        }
        for i in top5_indices
    ]

    # Confidence metadata
    confidence_level = get_confidence_level(confidence)

    # Gap between top-1 and top-2
    if len(top5_indices) >= 2:
        top2_confidence = float(filtered[top5_indices[1]])
        top1_top2_gap = round((confidence - top2_confidence) * 100, 2)
    else:
        top1_top2_gap = 100.0

    # Uncertain if confidence is low OR top1-top2 gap is very small
    is_uncertain = confidence < MODERATE_CONFIDENCE or top1_top2_gap < 10.0

    # Human-readable note
    if confidence_level == "low":
        prediction_note = (
            "Model confidence is low. This prediction should be verified "
            "with clinical symptoms and veterinary consultation."
        )
    elif confidence_level == "moderate":
        prediction_note = (
            "Model confidence is moderate. Consider this alongside "
            "reported symptoms for a more reliable assessment."
        )
    else:
        prediction_note = None

    return {
        "prediction_text": top_label,
        "confidence_percent": confidence_percent,
        "top_label": top_label.lower().replace(" ", "_"),
        "top5": top5,
        "confidence_level": confidence_level,
        "is_uncertain": is_uncertain,
        "prediction_note": prediction_note,
        "top1_top2_gap": top1_top2_gap,
        "tta_applied": tta_applied,
    }


# ──────────────────────────────────────────────
#  /predict  — image classification endpoint
# ──────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    image_path = data.get("image_path")
    species = (data.get("species") or "").strip().lower()  # "dog", "cat", or ""

    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": f"Image file not found: {image_path}"}), 400

    try:
        # Initial single-pass prediction
        tensor = preprocess_image(image_path)
        predictions = tf_model.predict(tensor, verbose=0)[0]

        # Apply species filter
        filtered = apply_species_filter(predictions, species)

        # Check if TTA is needed (confidence below HIGH threshold)
        top_confidence = float(filtered[np.argmax(filtered)])

        if top_confidence < HIGH_CONFIDENCE:
            # Run test-time augmentation
            aug_tensors = create_augmented_tensors(image_path)
            aug_predictions = tf_model.predict(aug_tensors, verbose=0)  # shape: (4, 22)

            # Average original + augmented predictions
            all_preds = np.vstack([predictions.reshape(1, -1), aug_predictions])  # (5, 22)
            averaged = np.mean(all_preds, axis=0)

            # Re-apply species filter on averaged result
            filtered = apply_species_filter(averaged, species)

            return jsonify(build_response(filtered, tta_applied=True))

        return jsonify(build_response(filtered, tta_applied=False))

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
