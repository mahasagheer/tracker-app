const { app, BrowserWindow, ipcMain, desktopCapturer, screen, powerMonitor } = require('electron');
const url = require('url');
const path = require('path');
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const { uIOhook, UiohookKey, UiohookMouse } = require('uiohook-napi');
const { upsert, getUnsynced, db } = require('./db/database');
// TEMP: Clear all SQLite data on app start (remove after running once)
const { clearAllData } = require('./db/database');
clearAllData();
console.log('All data cleared from SQLite tables.');
const axios = require('axios');
const bcrypt = require('bcryptjs');

// Store last sync timestamps in memory (for demo; use persistent storage in production)
let lastSync = {
  employees: '1970-01-01T00:00:00Z', // Force full initial sync for employees
  sessions: '2024-01-01T00:00:00Z',
  screenshots: '2024-01-01T00:00:00Z',
  activitylogs: '2024-01-01T00:00:00Z',
};

// Add robust error handling to syncTable
async function syncTable(table, employee_id) {
  try {
    // 1. Upload local changes
    const unsynced = getUnsynced(table, lastSync[table]);
    if (unsynced.length) {
      await axios.post('http://localhost:5000/api/sync/upload', { table, changes: unsynced });
      console.log(`[SYNC] Uploaded ${unsynced.length} changes to ${table}`);
    }
    // 2. Download server changes
    const { data } = await axios.get('http://localhost:5000/api/sync/download', {
      params: { table, since: lastSync[table], employee_id }
    });
    for (const row of data.changes) {
      try {
        upsert(table, row);
      } catch (e) {
        console.error('Failed to upsert row:', row, e);
        // Don't throw here, just log
      }
    }
    console.log(`[SYNC] Downloaded ${data.changes.length} changes from ${table}`);
    // 3. Update lastSync
    lastSync[table] = new Date().toISOString();
  } catch (error) {
    // Log full error details
    console.error(`[SYNC ERROR] Table: ${table}`, error?.response?.data || error.message || error);
  }
}

const SYNCED_TABLES = ['companies', 'employees', 'sessions', 'screenshots', 'activitylogs'];

// Add error handling to syncAllTables so one table's failure doesn't stop others
async function syncAllTables(employee_id) {
  for (const table of SYNCED_TABLES) {
    try {
      await syncTable(table, employee_id);
    } catch (e) {
      console.error(`[SYNC ALL] Failed to sync table ${table}:`, e);
    }
  }
}

ipcMain.handle('sync:now', async (event, employee_id) => {
  for (const table of SYNCED_TABLES) {
    try {
      await syncTable(table, employee_id);
    } catch (e) {
      console.error(`[SYNC NOW] Failed to sync table ${table}:`, e);
    }
  }
  return { status: 'ok' };
});

let guideWindow, timerWindow, inactivityWindow;
let timerState = 'paused'; // 'working' or 'paused'
let keyCount = 0;
let mouseActivityCount = 0;
let maxMouseEvents = 1000; // Fixed max for mouse percentage calculation
let maxKeyEvents = 1000; // Fixed max for keyboard percentage calculation
let currentEmployee = null; // { id, name, email, role }
let currentSessionId = null;
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

// Helper to create a new session in the database
function startNewSession(employeeId) {
  const sessionId = uuidv4();
  const startTime = new Date().toISOString();
  upsert('Sessions', {
    id: sessionId,
    employee_id: employeeId,
    start_time: startTime,
    is_synced: 0,
    created_at: startTime,
    last_modified: startTime,
    deleted_at: null,
  });
  return sessionId;
}

// Helper to end the current session in the database
function endCurrentSession() {
  if (!currentSessionId) return;
  const endTime = new Date().toISOString();
  // Fetch the session to calculate duration
  const session = db.prepare('SELECT * FROM Sessions WHERE id = ?').get(currentSessionId);
  let totalDuration = null;
  if (session && session.start_time) {
    const start = new Date(session.start_time);
    const end = new Date(endTime);
    totalDuration = Math.round((end - start) / 60000); // minutes
  }
  upsert('Sessions', {
    id: currentSessionId,
    employee_id: currentEmployee?.id,
    end_time: endTime,
    total_duration_minutes: totalDuration,
    last_modified: endTime,
  });
  currentSessionId = null;
}

// Capture screenshot and save to test_screenshots folder
async function captureAndSaveScreenshot(hour, minute) {
  console.log('captureAndSaveScreenshot called. Current timerState:', timerState);
  if (timerState !== 'working' || !currentEmployee || !currentSessionId) {
    console.log('Timer is paused or no session/employee, skipping screenshot.');
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
  const imagePath = path.join(folderPath, fileName);
  fs.writeFileSync(imagePath, image);
  const capturedAt = new Date().toISOString();
  // Save screenshot record to DB
  upsert('Screenshots', {
    id: uuidv4(),
    session_id: currentSessionId,
    employee_id: currentEmployee.id,
    image_path: imagePath,
    captured_at: capturedAt,
    is_synced: 0,
    last_modified: capturedAt,
    deleted_at: null,
  });
  // Save activity log record to DB
  upsert('ActivityLogs', {
    id: uuidv4(),
    session_id: currentSessionId,
    employee_id: currentEmployee.id,
    click_count: mouseActivityCount,
    key_count: keyCount,
    mouse_events: mouseActivityCount,
    keyboard_events: keyCount,
    productivity: overallProductivity,
    mouse_activity_percent: mouseActivityPercent,
    keyboard_activity_percent: keyboardActivityPercent,
    timestamp: capturedAt,
    is_synced: 0,
    last_modified: capturedAt,
    deleted_at: null,
  });
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

const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let syncInterval = null;
// Update SYNCED_TABLES to sync companies first

// Return the id of the currently logged-in employee, or null if not logged in
function getCurrentEmployeeId() {
  return currentEmployee && currentEmployee.id ? currentEmployee.id : null;
}

function startAutoSync() {
  const employee_id = getCurrentEmployeeId();
  // Initial sync on app start
  syncAllTables(employee_id);
  // Periodic sync every 2 minutes
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    syncAllTables(employee_id);
  }, SYNC_INTERVAL_MS);
}

app.on('ready', () => {
  createGuideWindow();
  startHourlyScreenshotScheduler();
  startInactivityMonitor();
  startAutoSync();
});

ipcMain.on('show-timer-window', () => {
    if (guideWindow) guideWindow.close();
    createTimerWindow();
});

ipcMain.on('timer-state', (event, newState) => {
  console.log('Timer state changed to:', newState);
  console.log('currentEmployee:', currentEmployee);
  console.log('currentSessionId:', currentSessionId);
  if (newState === 'working') {
    if (currentEmployee && !currentSessionId) {
      currentSessionId = startNewSession(currentEmployee.id);
      console.log('Started new session:', currentSessionId);
    } else if (!currentEmployee) {
      console.warn('Cannot start session: currentEmployee is not set. Please log in before starting the timer.');
    }
  } else if (timerState === 'working' && newState !== 'working') {
    endCurrentSession();
    console.log('Ended session');
  }
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
  // Check for duplicate email
  const existing = db.prepare('SELECT id FROM Employees WHERE email = ?').get(employee.email);
  if (existing) {
    return { success: false, message: 'Employee with this email already exists.' };
  }
  const stmt = db.prepare(
    'INSERT INTO Employees (id, name, assigned_email, device_id, is_active, email) VALUES (?, ?, ?, ?, ?, ?)' 
  );
  const id = uuidv4();
  stmt.run(id, employee.name, employee.assigned_email, employee.device_id, employee.is_active ?? 1, employee.email);
  return { success: true, id };
});

ipcMain.handle('db:get-employees', () => {
  return db.prepare('SELECT * FROM Employees').all();
});

ipcMain.handle('login:employee', async (event, { email, password }) => {
  const row = db.prepare('SELECT * FROM Employees WHERE email = ?').get(email);
  if (!row) {
    return { success: false, message: 'User not found' };
  }
  // Use bcrypt to compare hashed password
  const valid = await bcrypt.compare(password, row.password);
  if (!valid) {
    return { success: false, message: 'Invalid password' };
  }
  // Set global current employee
  currentEmployee = { id: row.id, name: row.name, email: row.email, role: row.role };
  console.log('Logged in as:', currentEmployee); // Debug log
  return { success: true, user: currentEmployee };
});
