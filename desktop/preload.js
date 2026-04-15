const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Lock/unlock machine functionality
  lockMachine: async () => {
    try {
      const result = await ipcRenderer.invoke('lock-machine');
      return result;
    } catch (error) {
      console.error('Failed to lock machine:', error);
      return { success: false, message: error.message };
    }
  },
  
  unlockMachine: async () => {
    try {
      const result = await ipcRenderer.invoke('unlock-machine');
      return result;
    } catch (error) {
      console.error('Failed to unlock machine:', error);
      return { success: false, message: error.message };
    }
  },
  
  isKioskMode: async () => {
    try {
      const result = await ipcRenderer.invoke('is-kiosk-mode');
      return result;
    } catch (error) {
      console.error('Failed to check kiosk mode:', error);
      return false;
    }
  },
  
  // App information
  getVersion: () => {
    return process.env.ELECTRON_IS_DEV ? 'Development' : 'Production';
  },
  
  isElectron: () => {
    return true;
  }
});

// Security: Prevent access to node modules
window.nodeRequire = undefined;
delete window.process;
delete window.require;
delete window.global;
delete window.Buffer;
