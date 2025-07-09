const { app, BrowserWindow, ipcMain, desktopCapturer, screen, powerMonitor } = require('electron');
const url = require('url');
const path = require('path');
const fs = require("fs");
const db = require('./db/database');
const { v4: uuidv4 } = require('uuid');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const { uIOhook, UiohookKey, UiohookMouse } = require('uiohook-napi');

let guideWindow, timerWindow, inactivityWindow;
let timerState = 'paused'; // 'working' or 'paused'
let keyCount = 0;
let mouseActivityCount = 0;
let maxMouseEvents = 1000; // Fixed max for mouse percentage calculation
let maxKeyEvents = 1000; // Fixed max for keyboard percentage calculation
const gkl = new GlobalKeyboardListener();
gkl.addListener(function (e, down) {
  if (down && e.state === 'DOWN') {
    keyCount++;
  }
});

uIOhook.on('mousemove', event => {
  mouseActivityCount++;
});

uIOhook.on('mousedown', event => {
  mouseActivityCount++;
});

uIOhook.on('keydown', event => {
  keyCount++;
});

uIOhook.start();

function createGuideWindow() {
    guideWindow = new BrowserWindow({
        title: 'Electron App',
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        minimizable: false,
        maximizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    const startUrl = url.format({
        pathname: path.join(__dirname, 'my-app/build/index.html'),
        protocol: 'file',
        slashes: true,
    });
    guideWindow.loadURL(startUrl);
   // guideWindow.webContents.openDevTools(); // Open DevTools for debugging
    guideWindow.on('closed', () => { guideWindow = null; });
}

function createTimerWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 180; // or your desired width
  const windowHeight = 32; // or your desired height

  timerWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth, // anchor to right
    y: screenHeight - windowHeight, // anchor to bottom
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  const timerUrl = url.format({
    pathname: path.join(__dirname, 'my-app/build/index.html'),
    protocol: 'file',
    slashes: true
  }) + '?timer=1';
  console.log('Loading timer overlay URL:', timerUrl);
  timerWindow.loadURL(timerUrl);
  timerWindow.once('ready-to-show', () => {
    timerWindow.setSize(windowWidth, windowHeight);
    timerWindow.show();
  });
  timerWindow.on('closed', () => { timerWindow = null; });
}

function createInactivityWindow() {
  if (inactivityWindow) {
    inactivityWindow.focus();
    return;
  }
  inactivityWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    minimizable: false,
    maximizable: false,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    backgroundColor: '#fff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  const inactivityUrl = url.format({
    pathname: path.join(__dirname, 'my-app/build/index.html'),
    protocol: 'file',
    slashes: true
  }) + '?inactivity=1';
  inactivityWindow.loadURL(inactivityUrl);
  inactivityWindow.on('closed', () => { inactivityWindow = null; });
}

// Helper to get current hour as string (e.g., '09')
function getCurrentHourString() {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0');
}

// Generate 6 unique random minutes for the hour
function getRandomMinutes() {
  const minutes = new Set();
  while (minutes.size < 6) {
    minutes.add(Math.floor(Math.random() * 60));
  }
  return Array.from(minutes).sort((a, b) => a - b);
}

// Capture screenshot and save to test_screenshots folder
async function captureAndSaveScreenshot(hour, minute) {
  console.log('captureAndSaveScreenshot called. Current timerState:', timerState);
  if (timerState !== 'working') {
    console.log('Timer is paused, skipping screenshot.');
    return;
  }
  // Get the primary display's size
  const { width, height } = screen.getPrimaryDisplay().size;

  // Request sources with a full-size thumbnail
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  });

  const screenSource = sources[0];
  const image = screenSource.thumbnail.toPNG();

  const folderPath = path.join(__dirname, 'test_screenshots');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const fileName = `screenshot_${hour}-${minute.toString().padStart(2, '0')}.png`;
  fs.writeFileSync(path.join(folderPath, fileName), image);
  console.log(`Screenshot saved: ${fileName}`);
  console.log(`Key presses detected since last screenshot: ${keyCount}`);
  console.log(`Mouse activity detected since last screenshot: ${mouseActivityCount}`);
  const mouseActivityPercent = Math.min((mouseActivityCount / maxMouseEvents) * 100, 100).toFixed(2);
  const keyboardActivityPercent = Math.min((keyCount / maxKeyEvents) * 100, 100).toFixed(2);
  const overallProductivity = ((parseFloat(mouseActivityPercent) + parseFloat(keyboardActivityPercent)) / 2).toFixed(2);
  console.log(`Mouse Activity %: ${mouseActivityPercent}%`);
  console.log(`Keyboard Activity %: ${keyboardActivityPercent}%`);
  console.log(`Overall Productivity %: ${overallProductivity}%`);
  keyCount = 0;
  mouseActivityCount = 0;
  if (timerWindow) {
    timerWindow.webContents.send('screenshot-taken');
  }
}

// Main scheduling logic
function scheduleRandomScreenshotsForHour() {
  const hour = getCurrentHourString();
  const randomMinutes = getRandomMinutes();
  console.log(`Scheduled screenshot minutes for hour ${hour}:`, randomMinutes);

  randomMinutes.forEach(minute => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minute, 0, 0);
    let delay = target - now;
    if (delay < 0) delay += 60 * 60 * 1000; // If already past, schedule for next hour

    setTimeout(() => {
      captureAndSaveScreenshot(hour, minute);
    }, delay);
  });
}

// Reschedule every hour
function startHourlyScreenshotScheduler() {
  scheduleRandomScreenshotsForHour();

  setInterval(() => {
    scheduleRandomScreenshotsForHour();
  }, 60 * 60 * 1000); // Every hour
}

function startInactivityMonitor() {
  let wasPaused = false;
  setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
    if (idleTime >= 600) { // 10 minutes
      if (!wasPaused && timerWindow) {
        timerWindow.webContents.send('inactivity-pause');
        createInactivityWindow();
        wasPaused = true;
      }
    } else {
      wasPaused = false;
    }
  }, 1000); // check every second
}

ipcMain.on('resume-from-inactivity', () => {
  if (inactivityWindow) {
    inactivityWindow.close();
    inactivityWindow = null;
  }
  if (timerWindow) {
    timerWindow.webContents.send('resume-from-inactivity');
  }
});

app.whenReady().then(() => {
  createGuideWindow();
  startHourlyScreenshotScheduler();
  startInactivityMonitor();
});

ipcMain.on('show-timer-window', () => {
    if (guideWindow) guideWindow.close();
    createTimerWindow();
});

ipcMain.on('timer-state', (event, newState) => {
  console.log('Timer state changed to:', newState);
  timerState = newState;
});

async function takeScreenshot(sessionId) {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  const screen = sources[0];

  const image = screen.thumbnail.toPNG();
  const folderPath = path.join(__dirname, 'screenshots', sessionId);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const fileName = `screenshot-${Date.now()}.png`;
  fs.writeFileSync(path.join(folderPath, fileName), image);
}

ipcMain.handle('db:add-employee', (event, employee) => {
  const stmt = db.prepare(
    'INSERT INTO Employees (id, name, assigned_email, device_id, is_active) VALUES (?, ?, ?, ?, ?)' 
  );
  const id = uuidv4();
  stmt.run(id, employee.name, employee.assigned_email, employee.device_id, employee.is_active ?? 1);
  return id;
});

ipcMain.handle('db:get-employees', () => {
  return db.prepare('SELECT * FROM Employees').all();
});
