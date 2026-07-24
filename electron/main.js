import { app, BrowserWindow, Menu, session, net, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.json': 'application/json'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Resolve `rawName` against `dir` and guarantee the result stays inside `dir`.
// Blocks path traversal ("../"), absolute paths, and drive-letter escapes from
// any renderer-supplied save/scenario name. Throws if the path would escape.
function safeResolve(dir, rawName) {
  if (typeof rawName !== 'string' || rawName.length === 0) {
    throw new Error('Invalid file name');
  }
  const root = path.resolve(dir);
  const resolved = path.resolve(root, rawName);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error('Path escapes target directory');
  }
  return resolved;
}

// Defense-in-depth for every BrowserWindow: deny popups and block navigation to
// any origin other than the local dev server / bundled files. nodeIntegration is
// already off and contextIsolation on, but this stops a stray link or injected
// URL from steering the renderer to a remote origin.
function hardenWindow(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('http://localhost:5000') || url.startsWith('file://');
    if (!allowed) event.preventDefault();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: isDev 
      ? path.join(__dirname, '../client/public/images/entities/zombie.png')
      : path.join(__dirname, '../dist/images/entities/zombie.png'),
    title: 'Zombie Road',
    show: false,
    titleBarStyle: 'default'
  });

  // Set up protocol to serve images and other resources in production
  if (!isDev) {
    mainWindow.webContents.session.protocol.handle('file', (request) => {
      const distRoot = path.resolve(path.join(__dirname, '..', 'dist'));
      const pathname = new URL(request.url).pathname;

      // Resolve the request to an absolute path, then require it to live inside
      // dist/. All production assets are bundled there; anything outside (e.g.
      // file:///C:/Users/... probing) is refused rather than streamed.
      let filePath;
      if (/^\/[a-zA-Z]:\//.test(pathname)) {
        filePath = path.resolve(decodeURIComponent(pathname.substring(1)));
      } else {
        filePath = path.resolve(path.join(distRoot, decodeURIComponent(pathname)));
      }

      if (filePath !== distRoot && !filePath.startsWith(distRoot + path.sep)) {
        return new Response('Forbidden', { status: 403 });
      }

      try {
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          return new Response('File Not Found', { status: 404 });
        }

        const stat = fs.statSync(filePath);
        const mimeType = getMimeType(filePath);
        const rangeHeader = request.headers.get('range') || request.headers.get('Range');

        if (rangeHeader) {
          const parts = rangeHeader.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const chunksize = (end - start) + 1;
          
          return new Response(fs.createReadStream(filePath, { start, end }), {
            status: 206,
            headers: {
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize.toString(),
              'Content-Type': mimeType
            }
          });
        } else {
          return new Response(fs.createReadStream(filePath), {
            status: 200,
            headers: {
              'Content-Length': stat.size.toString(),
              'Content-Type': mimeType,
              'Accept-Ranges': 'bytes'
            }
          });
        }
      } catch (error) {
        console.error('[Protocol] Error reading file:', filePath, error);
        return new Response('File Not Found', { status: 404 });
      }
    });
  }

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the dist folder
    const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (isDev) console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
    // [TEMP DIAGNOSTIC] kept for ONE verification build so any residual packaged
    // error is visible. Remove this line once the packaged launch is confirmed working.
    mainWindow.webContents.openDevTools();
  }

  hardenWindow(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Add a new shortcut for the developer console (development only)
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.openDevTools();
        event.preventDefault();
      }
    });
  }
}

// Disable geolocation at the engine level to prevent Windows location data warnings
app.commandLine.appendSwitch('disable-blink-features', 'Geolocation');

// Disable autoplay policy to allow game music to play instantly on startup
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// --- IPC Scenario Handlers (customMaps/) ---
const scenarioDir = path.join(__dirname, '..', 'customMaps');

ipcMain.handle('save-scenario', async (event, name, data) => {
  try {
    if (!fs.existsSync(scenarioDir)) fs.mkdirSync(scenarioDir, { recursive: true });
    const filePath = safeResolve(scenarioDir, `${name}.scenario.json`);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-scenario-editor', async (event, name, data) => {
  try {
    if (!fs.existsSync(scenarioDir)) fs.mkdirSync(scenarioDir, { recursive: true });
    const filePath = safeResolve(scenarioDir, `${name}.editor.json`);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-scenarios', async () => {
  try {
    if (!fs.existsSync(scenarioDir)) return [];
    const files = fs.readdirSync(scenarioDir);
    const scenarios = [];
    for (const file of files) {
      if (file.endsWith('.scenario.json')) {
        const filePath = path.join(scenarioDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          scenarios.push({ name: data.name || file, width: data.width, height: data.height, fileName: file });
        } catch (err) {
          console.warn('[Scenario IPC] Corrupt scenario file:', file);
        }
      }
    }
    return scenarios.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
});

// Entity image catalog for the map editor's NPC icon picker: lists whatever
// .png/.jpg/.gif/.svg files actually exist in the entities art folder, so any
// image dropped in there (new or existing) is immediately pickable with no
// code changes or manual list-maintenance.
ipcMain.handle('list-entity-images', async () => {
  try {
    const entitiesDir = isDev
      ? path.join(__dirname, '../client/public/images/entities')
      : path.join(__dirname, '../dist/images/entities');
    if (!fs.existsSync(entitiesDir)) return [];
    const exts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg']);
    return fs.readdirSync(entitiesDir)
      .filter(f => exts.has(path.extname(f).toLowerCase()))
      .map(f => f.slice(0, -path.extname(f).length))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.warn('[Entity Images IPC] Failed to list entity images:', error.message);
    return [];
  }
});

ipcMain.handle('load-scenario', async (event, fileName) => {
  try {
    const filePath = safeResolve(scenarioDir, fileName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
});

ipcMain.handle('load-scenario-editor', async (event, name) => {
  try {
    const filePath = safeResolve(scenarioDir, `${name}.editor.json`);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
});

ipcMain.handle('delete-scenario', async (event, fileName) => {
  try {
    const filePath = safeResolve(scenarioDir, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    // Also delete editor state file
    const editorFile = filePath.replace('.scenario.json', '.editor.json');
    if (fs.existsSync(editorFile)) fs.unlinkSync(editorFile);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- IPC Game Window (launched from editor) ---
ipcMain.handle('open-game-window', async () => {
  const gameWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Zombie Road',
    show: false,
  });

  if (isDev) {
    gameWindow.loadURL('http://localhost:5000/#/');
  } else {
    const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
    gameWindow.loadFile(htmlPath, { hash: '#/' });
  }

  hardenWindow(gameWindow);

  gameWindow.once('ready-to-show', () => gameWindow.show());

  if (isDev) {
    gameWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        gameWindow.webContents.openDevTools();
        event.preventDefault();
      }
    });
  }

  return { success: true };
});

// --- IPC Editor Window ---
let editorWindow = null;

ipcMain.handle('open-editor-window', async () => {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.focus();
    return { success: true, reused: true };
  }

  editorWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Zombie Road — Map Editor',
    show: false,
  });

  if (isDev) {
    editorWindow.loadURL('http://localhost:5000/#/editor');
  } else {
    const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
    editorWindow.loadFile(htmlPath, { hash: '#/editor' });
  }

  hardenWindow(editorWindow);

  editorWindow.once('ready-to-show', () => editorWindow.show());
  editorWindow.on('closed', () => { editorWindow = null; });

  return { success: true, reused: false };
});

// --- IPC Save Handlers ---
const saveDir = path.join(app.getPath('userData'), 'saves');

ipcMain.handle('save-game', async (event, slotName, data) => {
  try {
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    const filePath = safeResolve(saveDir, `${slotName}.json`);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('[Save IPC] Failed to write save:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-game', async (event, slotName) => {
  try {
    const filePath = safeResolve(saveDir, `${slotName}.json`);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('[Save IPC] Failed to read save:', error);
    throw error;
  }
});

ipcMain.handle('delete-game', async (event, slotName) => {
  try {
    const filePath = safeResolve(saveDir, `${slotName}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    // Also delete any associated chunk files
    if (fs.existsSync(saveDir)) {
      const files = fs.readdirSync(saveDir);
      for (const file of files) {
        if (file.startsWith(`${slotName}_chunk_`) && file.endsWith('.json')) {
          try {
            fs.unlinkSync(path.join(saveDir, file));
          } catch (err) {
            console.warn(`[Save IPC] Failed to delete chunk file ${file}:`, err);
          }
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error('[Save IPC] Failed to delete save:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-saves', async () => {
  try {
    if (!fs.existsSync(saveDir)) return [];
    const files = fs.readdirSync(saveDir);
    const saves = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const slotName = path.basename(file, '.json');
        const filePath = path.join(saveDir, file);
        const stats = fs.statSync(filePath);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          saves.push({
            slotName,
            timestamp: data.timestamp || stats.mtimeMs,
            turn: data.turn || 1,
            version: data.version || '1.0.0',
            characterId: data.characterId || null
          });
        } catch (err) {
          console.warn('[Save IPC] Corrupt save file:', file);
        }
      }
    }
    return saves.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[Save IPC] Failed to list saves:', error);
    return [];
  }
});

app.whenReady().then(() => {
  // Explicitly deny geolocation and other unused permissions to prevent Windows location warnings
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const blockedPermissions = ['geolocation', 'notifications', 'midi', 'clipboard-read', 'media'];
    if (blockedPermissions.includes(permission)) {
      console.log(`[Permission] Blocking ${permission} request`);
      return callback(false);
    }
    // Allow others by default, or you can be more restrictive
    callback(true);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Remove default menu on Windows
if (process.platform === 'win32') {
  Menu.setApplicationMenu(null);
}