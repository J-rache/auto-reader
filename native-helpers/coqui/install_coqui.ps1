# PowerShell script to install Coqui TTS in a virtual environment (Windows)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Venv = Join-Path $Root 'venv'
$Models = Join-Path $Root 'models'
Write-Host "Creating venv at $Venv"
python -m venv $Venv
& "$Venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
python -m pip install TTS
New-Item -ItemType Directory -Force -Path $Models | Out-Null
Write-Host "Coqui TTS installed. To run server:`n& $Venv\Scripts\Activate.ps1 ; python -m TTS.server --model_name tts_models/en/ljspeech/tacotron2-DDC"
Write-Host "This script does not auto-download large models. Use TTS CLI to fetch models or the app's installer UI."
