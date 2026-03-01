Native Messaging Host Manifests and Instructions

This folder contains example native messaging host manifests for Chrome/Edge and Firefox on Windows/macOS/Linux.

Important: Browser native messaging requires a small host executable or script installed on the user's machine and a platform-specific registration (registry entry on Windows, JSON manifest on macOS/Linux). For security, the manifest must list the allowed extension IDs.

Windows (example):
- Create a JSON manifest, e.g. `com.reader.nativehost.json`, and place it in `C:\Users\<user>\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\` or register via registry key `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.reader.nativehost` with value pointing to manifest path.

macOS/Linux (example):
- Place manifest under `~/.config/google-chrome/NativeMessagingHosts/com.reader.nativehost.json` or `/etc/opt/chrome/native-messaging-hosts/`.

Contents of example manifest:

{
  "name": "com.reader.nativehost",
  "description": "Native host for Reader app",
  "path": "C:\\path\\to\\native-messaging\\host.exe",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://<extension-id>/"]
}

Use `native-messaging/host.js` as a prototype host (Node). For production, compile or wrap it into a platform-specific executable and register accordingly.
