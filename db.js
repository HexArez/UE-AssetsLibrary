const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')

/**
 * @description Adaptador para la base de datos JSON.
 * @type {JSONFile<object>}
 */
const adapter = new JSONFile('library.json')
/**
 * @description Instancia de la base de datos.
 * @type {Low<object>}
 */
const db = new Low(adapter, { files: [] })

/**
 * @description Inicializa la base de datos, asegurando que el archivo exista y tenga una estructura inicial.
 * @returns {Promise<void>}
 */
async function init() {
  await db.read()
  db.data ||= { files: [] }
  await db.write()
}
init()

/**
 * @description Inserta un nuevo archivo en la base de datos si no existe previamente.
 * @param {string} name - El nombre del archivo.
 * @param {string} path - La ruta del archivo.
 * @returns {Promise<void>}
 */
async function insertFile(name, path) {
  const exists = db.data.files.find(f => f.path === path)
  if (!exists) {
    db.data.files.push({
      id: Date.now(),
      name,
      path,
      description: "",
      image: ""
    })
    await db.write()
  }
}

/**
 * @description Obtiene todos los archivos de la base de datos.
 * @returns {Promise<Array<object>>} - Un array con todos los archivos.
 */
async function getFiles() {
  await db.read()
  return db.data.files
}

/**
 * @description Actualiza la descripción o la imagen de un archivo existente.
 * @param {number} id - El ID del archivo a actualizar.
 * @param {object} { description, image } - Los datos a actualizar.
 * @param {string} [description] - La nueva descripción del archivo.
 * @param {string} [image] - La nueva imagen del archivo.
 * @returns {Promise<void>}
 */
async function updateFile(id, { description, image }) {
  const file = db.data.files.find(f => f.id === id)
  if (file) {
    if (description !== undefined) file.description = description
    if (image !== undefined) file.image = image
    await db.write()
  }
}

/**
 * @description Elimina un archivo de la base de datos.
 * @param {number} id - El ID del archivo a eliminar.
 * @returns {Promise<void>}
 */
async function removeFile(id) {
  await db.read()
  db.data.files = db.data.files.filter(f => f.id !== id)
  await db.write()
}

module.exports = {
  insertFile,
  getFiles,
  updateFile,
  removeFile
}
