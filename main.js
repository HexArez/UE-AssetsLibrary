const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./db')

/**
 * @description Ventana principal de la aplicación.
 * @type {BrowserWindow}
 */
let mainWindow

/**
 * @description Ruta al archivo de configuración.
 * @type {string}
 */
const configPath = path.join(__dirname, 'config.json')

/**
 * @description Guarda la última carpeta seleccionada en el archivo de configuración.
 * @param {string} folderPath - La ruta de la carpeta a guardar.
 */
function saveLastFolder(folderPath) {
  fs.writeFileSync(configPath, JSON.stringify({ lastFolder: folderPath }, null, 2))
}

/**
 * @description Lee la última carpeta seleccionada desde el archivo de configuración.
 * @returns {string|null} - La ruta de la última carpeta o null si no se encuentra.
 */
function readLastFolder() {
  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      return data.lastFolder
    } catch {
      return null
    }
  }
  return null
}

/**
 * @description Evento que se dispara cuando la aplicación está lista.
 */
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nativeWindowOpen: true
    }
  })
  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadFile('index.html')
})

/**
 * @description Oculta la barra de menú en todas las ventanas creadas.
 */
app.on('browser-window-created', (event, window) => {
  window.setMenuBarVisibility(false)
  window.setAutoHideMenuBar(true)
})

/**
 * @description Escanea una carpeta en busca de archivos comprimidos y actualiza la base de datos.
 * @returns {Promise<Array<object>>} - Un array con los archivos encontrados.
 */
ipcMain.handle('scan-folder', async () => {
  const lastFolder = readLastFolder()
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    defaultPath: lastFolder || undefined
  })

  if (result.canceled) return []

  const folder = result.filePaths[0]
  saveLastFolder(folder) // Save the new path

  const files = []

  function scanDir(dir) {
    const items = fs.readdirSync(dir)
    for (let item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (/\.(zip|rar|7z)$/i.test(item)) {
        files.push({ name: item, path: fullPath })
      }
    }
  }

  scanDir(folder)

  // 1. Get current files from the database
  const dbFiles = await db.getFiles()

  // 2. Remove files from the database that no longer exist on disk
  for (const file of dbFiles) {
    if (!fs.existsSync(file.path)) {
      await db.removeFile(file.id)
    }
  }

  // 3. Add new files found on disk that are not in the database
  for (const f of files) {
    if (!dbFiles.some(dbF => dbF.path === f.path)) {
      await db.insertFile(f.name, f.path)
    }
  }

  return files
})

/**
 * @description Obtiene todos los archivos de la base de datos.
 * @returns {Promise<Array<object>>} - Un array con todos los archivos.
 */
ipcMain.handle('get-files', async () => {
  return await db.getFiles()
})

/**
 * @description Actualiza un archivo en la base de datos.
 * @param {object} event - El evento IPC.
 * @param {number} id - El ID del archivo a actualizar.
 * @param {object} data - Los datos a actualizar.
 * @returns {Promise<Array<object>>} - Un array con todos los archivos actualizados.
 */
ipcMain.handle('update-file', async (event, id, data) => {
  await db.updateFile(id, data)
  return await db.getFiles()
})

/**
 * @description Abre la ubicación de un archivo en el explorador de archivos.
 * @param {object} event - El evento IPC.
 * @param {string} filePath - La ruta del archivo a mostrar.
 */
ipcMain.handle('open-location', async (event, filePath) => {
  shell.showItemInFolder(filePath)
})

/**
 * @description Oculta la barra de menú en las nuevas ventanas creadas.
 */
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, window) => {
    window.setMenuBarVisibility(false)
    window.setAutoHideMenuBar(true)
  })
})
