const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Si tu app está desplegada en Vercel:
  win.loadURL("https://requests-user-frontend-production.vercel.app");
}

app.whenReady().then(createWindow);
