Coqui TTS integration (optional, high-quality offline)

This directory is a scaffold for a local Coqui TTS service. It is NOT included automatically.
Steps to enable:
1. Install Python 3.8+ and virtualenv.
2. Create a virtualenv and install Coqui TTS (per Coqui docs).
3. Download model weights you want to use and place under `native-helpers/coqui/models`.
4. Run the local HTTP server script (you need to add one; this is a placeholder).
5. The Electron app will call `http://localhost:5002/synthesize` with POST {text, voice}.

Note: shipping model weights with installer is optional; best to provide an "Install voices" UI that downloads models on demand.
