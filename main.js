const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true // Вимкни preload, якщо не використовуєш його
            // preload: path.join(__dirname, 'preload.js') // Закоментуй або видали цей рядок
        }
    });

    win.loadFile('index.html');

    win.on('closed', () => {
        win = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
