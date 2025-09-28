/**
 * @description Verifica si un texto es una URL válida.
 * @param {string} text - El texto a verificar.
 * @returns {boolean} - `true` si es una URL válida, de lo contrario `false`.
 */
function isURL(text) {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

/**
 * @description Carga y muestra los archivos en la interfaz de usuario, aplicando filtros y ordenamiento.
 * @returns {Promise<void>}
 */
async function loadFiles() {
  const files = await window.api.getFiles()
  const list = document.getElementById('list')
  list.innerHTML = ""

  // 2. Filter by search
  const filter = (document.getElementById('search')?.value || '').toLowerCase()
  let filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(filter)
  )

  // 3. Sort alphabetically
  filteredFiles = filteredFiles.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  filteredFiles.forEach(f => {
    const col = document.createElement('div')
    col.className = 'col-sm-4 col-md-4 d-flex justify-content-center'

    // The name is now just text
    const nameHtml = `<span>${f.name}</span>`

    // The path is now the link that opens the location
    const pathHtml = `<a href="#" onclick="window.api.openLocation('${f.path.replace(/\\/g, '\\\\')}');return false;">${f.path}</a>`

    // External search button
    // Remove extension
    let nameWithoutExtension = f.name.replace(/\.[^/.]+$/, '')
    // Exclude unwanted words or patterns
    nameWithoutExtension = nameWithoutExtension
      .replace(/\.part\d+/gi, '') // removes ".part1", ".part2", etc.
      .replace(/UE5\d+/gi, '')
      .replace(/UE5/gi, '')        // removes "UE5" (case-insensitive)
      .replace(/UE50/gi, '')      // removes "UE50" (case-insensitive)
      .replace(/UE5.\d+/gi, '')
      .replace(/UE51/gi, '')
      .replace(/UE5.1/gi, '')
      .replace(/UE52/gi, '')
      .replace(/UE5.2/gi, '')
      .replace(/UE53/gi, '')
      .replace(/UE5.3/gi, '')
      .replace(/UE54/gi, '')
      .replace(/UE5.4/gi, '')
      .replace(/UE55/gi, '')
      .replace(/UE5.5/gi, '')
      .replace(/UE56/gi, '')
      .replace(/UE5.6/gi, '')
      .replace(/UE4/gi, '')
      .replace(/UE4\d+/gi, '')
    // You can add more patterns here if you need to

    // Replace spaces, hyphens, underscores, and dots with "+"
    const searchName = nameWithoutExtension.replace(/[\s\-_]+/g, '+')
    const searchUrl = `https://www.fab.com/search?q=${searchName}`
    const searchBtn = `<button class="btn btn-outline-primary" onclick="window.open('${searchUrl}', '_blank', 'width=960,height=768')">🔎 Search on Fab</button>`

    // Description as URL if applicable
    let descriptionHtml = "No URL"
    if (f.description) {
      if (isURL(f.description)) {
        descriptionHtml = `<a href="${f.description}" target="_blank">${f.description}</a>`
      } else {
        descriptionHtml = f.description
      }
    }

    col.innerHTML = `
      <div class="card file-card shadow-sm">
        <div class="card-body d-flex flex-column align-items-center">
          ${f.image ? `<img src="${f.image}" class="file-img mb-2" alt="Thumbnail">` : ""}
          <h5 class="card-title text-center" style="font-size:1.1em;">
            ${nameHtml}
          </h5>
          <div class="mb-2 text-center" style="font-size:0.85em; color:#888;">
            ${pathHtml}
          </div>
          <p class="card-text text-center" style="font-size:0.95em;">${descriptionHtml}</p>
          <div class="d-flex justify-content-center gap-2 mt-auto">
            ${searchBtn}
            <button class="btn btn-outline-secondary btn-sm" onclick="editFile(${f.id})">Edit URL</button>
          </div>
        </div>
      </div>
    `
    list.appendChild(col)
  })

  document.getElementById('file-counter').textContent = `Total: ${filteredFiles.length}`
}

/**
 * @description Muestra u oculta el botón "Ir arriba" según la posición del scroll.
 */
window.onscroll = function() {
  const btn = document.getElementById('btn-top')
  if (window.scrollY > 200) {
    btn.style.display = 'block'
  } else {
    btn.style.display = 'none'
  }
}
/**
 * @description Desplaza la página hacia arriba suavemente al hacer clic en el botón "Ir arriba".
 */
document.getElementById('btn-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' })

/**
 * @description Inicia el escaneo de la carpeta de activos y actualiza la lista de archivos.
 * @returns {Promise<void>}
 */
async function scan() {
  await window.api.scanFolder()
  await loadFiles()
}

/**
 * @description Abre un modal para editar la URL de un archivo.
 * @param {number} id - El ID del archivo a editar.
 * @returns {Promise<void>}
 */
async function editFile(id) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal')
    const input = document.getElementById('modal-input')
    const btnOk = document.getElementById('modal-ok')
    const btnCancel = document.getElementById('modal-cancel')

    modal.style.display = 'flex'
    input.value = ''

    btnOk.onclick = async () => {
      modal.style.display = 'none'
      await window.api.updateFile(id, { description: input.value })
      await loadFiles()
      resolve()
    }
    btnCancel.onclick = () => {
      modal.style.display = 'none'
      resolve()
    }
    input.onkeydown = (e) => {
      if (e.key === 'Enter') btnOk.onclick()
    }
    input.focus()
  })
}

/**
 * @description Se ejecuta cuando la ventana se ha cargado completamente.
 * Carga los archivos iniciales y asegura que exista un campo de búsqueda.
 */
window.onload = () => {
  // Si no existe, crea el cuadro de búsqueda sobre la lista
  if (!document.getElementById('search')) {
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'search'
    input.placeholder = 'Search in the library...'
    input.style.marginBottom = '10px'
    input.style.width = '60%'
    input.oninput = loadFiles
    document.body.insertBefore(input, document.getElementById('list'))
  }
  loadFiles()
}

/**
 * @description Expone la función `editFile` al ámbito global para que pueda ser llamada desde el HTML.
 * @global
 */
window.editFile = editFile
