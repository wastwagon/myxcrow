#!/bin/bash

# Script to download face-api.js models
# These models are required for face detection and recognition

set -e

MODELS_DIR="./models"
MODELS_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master"

echo "📥 Downloading face-api.js models..."
echo ""

# Create models directory
mkdir -p "$MODELS_DIR"

# Download model files
echo "Downloading SSD MobileNet V1 model..."
curl -L "${MODELS_URL}/ssd_mobilenetv1_model-weights_manifest.json" -o "${MODELS_DIR}/ssd_mobilenetv1_model-weights_manifest.json"
curl -L "${MODELS_URL}/ssd_mobilenetv1_model-shard1" -o "${MODELS_DIR}/ssd_mobilenetv1_model-shard1"

echo "Downloading Face Landmark 68 model..."
curl -L "${MODELS_URL}/face_landmark_68_model-weights_manifest.json" -o "${MODELS_DIR}/face_landmark_68_model-weights_manifest.json"
curl -L "${MODELS_URL}/face_landmark_68_model-shard1" -o "${MODELS_DIR}/face_landmark_68_model-shard1"

echo "Downloading Face Recognition model..."
curl -L "${MODELS_URL}/face_recognition_model-weights_manifest.json" -o "${MODELS_DIR}/face_recognition_model-weights_manifest.json"
curl -L "${MODELS_URL}/face_recognition_model-shard1" -o "${MODELS_DIR}/face_recognition_model-shard1"
curl -L "${MODELS_URL}/face_recognition_model-shard2" -o "${MODELS_DIR}/face_recognition_model-shard2"

echo ""
echo "✅ Models downloaded successfully!"
echo "📁 Models location: ${MODELS_DIR}"
echo ""
echo "Total size:"
du -sh "$MODELS_DIR"




