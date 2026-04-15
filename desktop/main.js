const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isKioskMode = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false
  });

  // Load the built React app
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });
}

// IPC Handlers for lock/unlock functionality
ipcMain.handle('lock-machine', async () => {
  if (mainWindow && !isKioskMode) {
    isKioskMode = true;
    
    // Enter kiosk mode
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.removeMenu();
    
    // Prevent dev tools in production
    if (!process.env.ELECTRON_IS_DEV) {
      mainWindow.webContents.closeDevTools();
    }
    
    return { success: true, message: 'Machine locked successfully' };
  }
  return { success: false, message: 'Machine already locked' };
});

ipcMain.handle('unlock-machine', async () => {
  if (mainWindow && isKioskMode) {
    isKioskMode = false;
    
    // Exit kiosk mode
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMenuBarVisibility(true);
    
    return { success: true, message: 'Machine unlocked successfully' };
  }
  return { success: false, message: 'Machine already unlocked' };
});

ipcMain.handle('is-kiosk-mode', async () => {
  return isKioskMode;
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // On development, ignore certificate errors
  if (process.env.ELECTRON_IS_DEV) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
