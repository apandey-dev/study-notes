const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure single instance lock for Windows Desktop
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;
let fileToOpenOnStartup = null;

// Parse file path from command line arguments for Windows file associations (.md, .txt)
function getFilePathFromArgs(argv) {
  if (!argv || argv.length < 2) return null;
  const target = argv[argv.length - 1];
  if (target && !target.startsWith('-') && (target.endsWith('.md') || target.endsWith('.txt'))) {
    if (fs.existsSync(target)) return target;
  }
  return null;
}

fileToOpenOnStartup = getFilePathFromArgs(process.argv);

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      const newFilePath = getFilePathFromArgs(commandLine);
      if (newFilePath) {
        mainWindow.webContents.send('open-file-from-system', newFilePath);
      }
    }
  });
}

// User AppData Directory (%APPDATA%/Study Notes)
function getConfigFilePath() {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'config.json');
}

function loadConfig() {
  try {
    const configPath = getConfigFilePath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading AppData config:', e);
  }
  return {};
}

function saveConfig(updates) {
  try {
    const configPath = getConfigFilePath();
    const current = loadConfig();
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (e) {
    console.error('Error saving AppData config:', e);
    return null;
  }
}

function createWindow() {
  const config = loadConfig();
  const bounds = config.windowBounds || { width: 1100, height: 750 };

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 550,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: config.theme === 'dark' ? '#1E1E1E' : '#FAFAFA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/favicon.svg')
  });

  if (config.isMaximized) {
    mainWindow.maximize();
  }

  const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle production load failure gracefully with a diagnostic window instead of silent white screen
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[ELECTRON RENDERER DID-FAIL-LOAD]', { errorCode, errorDescription, validatedURL });
    if (!isDev) {
      const escapeHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #1E1E1E; color: #FFFFFF; line-height: 1.6;">
            <h2 style="color: #EF4444; margin-top: 0;">Application Startup Error</h2>
            <p>The renderer process failed to load. Diagnostics:</p>
            <div style="background: #2D2D2D; padding: 16px; border-radius: 8px; font-family: monospace;">
              <div><strong>Error Code:</strong> ${escapeHtml(errorCode)}</div>
              <div><strong>Description:</strong> ${escapeHtml(errorDescription)}</div>
              <div><strong>Failed URL:</strong> ${escapeHtml(validatedURL)}</div>
            </div>
          </body>
        </html>
      `)}`);
    }
  });

  // Once ready, check if app was opened with a file from Explorer
  mainWindow.webContents.on('did-finish-load', () => {
    if (fileToOpenOnStartup) {
      mainWindow.webContents.send('open-file-from-system', fileToOpenOnStartup);
      fileToOpenOnStartup = null;
    }
  });

  // Window Bounds Handler
  const saveWindowBounds = () => {
    if (!mainWindow) return;
    const isMaximized = mainWindow.isMaximized();
    if (!isMaximized) {
      const b = mainWindow.getBounds();
      saveConfig({ windowBounds: { width: b.width, height: b.height, x: b.x, y: b.y }, isMaximized: false });
    } else {
      saveConfig({ isMaximized: true });
    }
  };

  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('move', saveWindowBounds);

  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  // AppData Config Handlers
  ipcMain.handle('get-app-config', () => loadConfig());
  ipcMain.handle('save-app-config', (event, updates) => saveConfig(updates));

  // Workspace Files Listing (Scans Documents folder)
  ipcMain.handle('get-workspace-files', async () => {
    try {
      const docsDir = app.getPath('documents');
      let filesList = [];

      if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir);
        filesList = files
          .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
          .map(f => {
            const fullPath = path.join(docsDir, f);
            const stat = fs.statSync(fullPath);
            const ext = path.extname(f).replace('.', '').toLowerCase();
            return {
              fileName: f,
              filePath: fullPath,
              fileFormat: ext,
              folderPath: 'Documents',
              lastModified: stat.mtime.toISOString(),
              pageType: 'ruled'
            };
          });
      }

      return { success: true, files: filesList };
    } catch (err) {
      console.error('Error fetching workspace files:', err);
      return { success: false, error: err.message, files: [] };
    }
  });

  // File existence check
  ipcMain.handle('check-file-exists', (event, { filePath }) => {
    if (!filePath) return { exists: false };
    try {
      const exists = fs.existsSync(filePath);
      let actualName = null;
      let mtime = null;
      if (exists) {
        actualName = path.basename(filePath);
        const stat = fs.statSync(filePath);
        mtime = stat.mtime.toISOString();
      }
      return { exists, actualName, mtime };
    } catch (e) {
      return { exists: false };
    }
  });

  // Rename File
  ipcMain.handle('rename-file', async (event, { oldPath, newName }) => {
    if (!oldPath || !fs.existsSync(oldPath)) return { success: false, error: 'Original file not found' };
    try {
      const dir = path.dirname(oldPath);
      const ext = path.extname(oldPath);
      const cleanNewName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
      const newPath = path.join(dir, cleanNewName);

      fs.renameSync(oldPath, newPath);
      return {
        success: true,
        newPath,
        newFileName: cleanNewName
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Delete File
  ipcMain.handle('delete-file', async (event, { filePath }) => {
    if (!filePath || !fs.existsSync(filePath)) return { success: false, error: 'File not found' };
    try {
      fs.unlinkSync(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Duplicate File
  ipcMain.handle('duplicate-file', async (event, { filePath }) => {
    if (!filePath || !fs.existsSync(filePath)) return { success: false, error: 'File not found' };
    try {
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const nameWithoutExt = path.basename(filePath, ext);
      const newPath = path.join(dir, `${nameWithoutExt}_Copy${ext}`);
      fs.copyFileSync(filePath, newPath);
      return { success: true, newPath, newFileName: path.basename(newPath) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Create File Dialog
  ipcMain.handle('create-file-dialog', async (event, { defaultName = 'Study_Note', extension = 'md' } = {}) => {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Create Study Note',
      defaultPath: path.join(app.getPath('documents'), `${defaultName}.${extension}`),
      filters: [
        { name: 'Markdown Document (*.md)', extensions: ['md'] },
        { name: 'Text File (*.txt)', extensions: ['txt'] },
        { name: 'All Files (*.*)', extensions: ['*'] }
      ],
      properties: ['showOverwriteConfirmation']
    });

    if (canceled || !filePath) return { success: false };

    try {
      const ext = path.extname(filePath).replace('.', '').toLowerCase() || extension;
      fs.writeFileSync(filePath, '', 'utf-8');

      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        fileFormat: ext,
        content: ''
      };
    } catch (err) {
      dialog.showErrorBox('Error Creating File', `Could not create file:\n${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // Open File Dialog
  ipcMain.handle('open-file-dialog', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Study Note',
      filters: [
        { name: 'Study Notes (*.md, *.txt)', extensions: ['md', 'txt'] },
        { name: 'Markdown Document (*.md)', extensions: ['md'] },
        { name: 'Text File (*.txt)', extensions: ['txt'] },
        { name: 'All Files (*.*)', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false };

    try {
      const selectedPath = filePaths[0];
      const content = fs.readFileSync(selectedPath, 'utf-8');
      const ext = path.extname(selectedPath).replace('.', '').toLowerCase();
      return {
        success: true,
        filePath: selectedPath,
        fileName: path.basename(selectedPath),
        content,
        fileFormat: ext === 'txt' ? 'txt' : 'md'
      };
    } catch (err) {
      dialog.showErrorBox('Error Opening File', `Could not open file:\n${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // Direct File Write
  ipcMain.handle('save-file-content', async (event, { filePath, content }) => {
    if (!filePath) return { success: false, error: 'No file path provided' };
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Direct File Read
  ipcMain.handle('read-file-content', async (event, { filePath }) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File does not exist' };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
