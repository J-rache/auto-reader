#!/usr/bin/env bash
# Simple installer script for Coqui TTS local service (Linux/macOS)
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT/venv"
MODELS_DIR="$ROOT/models"

echo "Coqui installer: creating venv at $VENV_DIR"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
echo "Installing coqui TTS (TTS)..."
pip install TTS
mkdir -p "$MODELS_DIR"
echo "You can now run the TTS server with:\nsource $VENV_DIR/bin/activate && python -m TTS.server --model_name tts_models/en/ljspeech/tacotron2-DDC" 
echo "This script does not download large models automatically. Use TTS CLI to download desired models into $MODELS_DIR or follow app UI to download on demand."
