# EDUREP Desktop Application

This is the Electron-based desktop version of EDUREP that provides hardware-level kiosk mode functionality.

## Features

- **Hardware Kiosk Mode**: When the admin locks a session, the desktop app enters true kiosk mode
- **Dynamic Locking**: Instantly responds to admin dashboard lock/unlock toggles
- **Cross-Platform**: Supports Windows (.exe), macOS (.dmg), and Linux (.AppImage)
- **Secure IPC Bridge**: Safe communication between React app and native hardware controls

## Installation

### Development Setup

1. Install dependencies:
```bash
cd desktop
npm install
```

2. Build the web app first:
```bash
cd ..
npm run build
```

3. Run the desktop app in development:
```bash
cd desktop
npm run dev
```

### Production Build

1. Build the web app:
```bash
npm run build
```

2. Build desktop applications:
```bash
cd desktop
npm run build:windows    # Creates .exe installer
npm run build:mac        # Creates .dmg file
npm run build:linux      # Creates .AppImage
npm run build:all        # Builds all platforms
```

## How It Works

### Phase 1: Web Compatibility
The root folder remains a 100% compatible Vite React web application that can be deployed to Vercel, Netlify, or any web host.

### Phase 2: Desktop Integration
The `desktop/` folder contains the Electron shell that:
- Loads the built React app from `../dist/index.html`
- Provides IPC bridge via `preload.js`
- Handles hardware kiosk mode switching

### Phase 3: Lock Synchronization
- When admin toggles `isLocked: true` in Firebase
- Web version: Shows `beforeunload` warnings and Escape traps
- Desktop version: Enters kiosk mode (`setKiosk(true)`, `setAlwaysOnTop(true)`)
- When admin toggles `isLocked: false`
- Both versions: Instantly unlock and restore normal behavior

## Architecture

```
EDUREP/
  src/                    # React web app (100% web compatible)
    pages/
      ViewerScreen.jsx    # Handles both web and desktop lock logic
  desktop/                # Electron desktop shell
    main.js              # Electron main process
    preload.js           # IPC bridge
    package.json         # Desktop-specific dependencies
  dist/                  # Built React app (loaded by Electron)
```

## Security Features

- **Context Isolation**: Prevents Node.js access in renderer
- **Navigation Lock**: Blocks external links and file navigation
- **Dev Tools Protection**: Disables dev tools in production
- **Certificate Validation**: Proper SSL certificate handling

## URL Format

Due to Electron's file:// protocol, URLs use hash routing:
- Web: `https://yourapp.com/viewer/ABC123`
- Desktop: `file:///path/to/app/#/viewer/ABC123`

## Testing

To test the hardware lock functionality:

1. Start a session in the desktop app
2. Toggle the lock in the admin dashboard
3. Verify the desktop app enters kiosk mode (no title bar, always on top)
4. Enter the quit password to unlock
5. Verify normal window behavior is restored

## Icons

Add your app icons to `desktop/assets/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS) 
- `icon.png` (Linux, 256x256)

## Troubleshooting

### "App not loading"
- Ensure you've built the web app first: `npm run build`
- Check that `../dist/index.html` exists

### "Kiosk mode not working"
- Verify you're running the Electron app, not the web version
- Check browser console for IPC errors

### "Build fails"
- Install Electron dependencies: `cd desktop && npm install`
- Add icons to `desktop/assets/` folder
