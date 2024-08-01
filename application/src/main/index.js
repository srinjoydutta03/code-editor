import { app, shell, BrowserWindow, Menu, dialog, ipcMain, session} from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  createMenu();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; connect-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:; worker-src 'self' blob:"
      },
    });
  });

}

function createMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('file:new');
          }
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }
                mainWindow.webContents.send('file:opened', filePath, data);
              });
            }
          }
        },
        {
          label: 'Save File',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('file:save');
          }
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const folderPath = result.filePaths[0];
              const folderStructure = getFolderStructure(folderPath);
              mainWindow.webContents.send('folder:opened', folderStructure);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

function getFolderStructure(folderPath) {
  const result = { name: folderPath.split('/').pop(), children: [] };
  const items = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      result.children.push(getFolderStructure(join(folderPath, item.name)));
    } else {
      result.children.push({ name: item.name, path: join(folderPath, item.name) });
    }
  }

  return result;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      // filters: [
      //   { name: 'Text Files', extensions: ['txt', 'js', 'html', 'css', 'json'] },
      //   { name: 'All Files', extensions: ['*'] }
      // ]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, 'utf-8');
      return { filePath, content };
    }
  });

  ipcMain.handle('dialog:saveFile', async (_, filePath, content) => {
    if (!filePath) {
      const result = await dialog.showSaveDialog(mainWindow, {
        // filters: [
        //   { name: 'Text Files', extensions: ['txt', 'js', 'html', 'css', 'json'] },
        //   { name: 'All Files', extensions: ['*'] }
        // ]
      });
      if (result.canceled) return;
      filePath = result.filePath;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  });

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      return getFolderStructure(folderPath);
    }
  });

  ipcMain.handle('file:read', async (event, filePath) => {
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
