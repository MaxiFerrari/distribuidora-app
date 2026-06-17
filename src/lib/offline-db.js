// IndexedDB wrapper para almacenamiento offline
const DB_NAME = 'distribuidora_offline'
const DB_VERSION = 1

// Stores (tablas) en IndexedDB
const STORES = {
  CLIENTES: 'clientes',
  PRODUCTOS: 'productos',
  PEDIDOS: 'pedidos',
  PEDIDOS_PENDIENTES: 'pedidos_pendientes', // pedidos creados offline
  SYNC_QUEUE: 'sync_queue' // cola de sincronización
}

class OfflineDB {
  constructor() {
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Store de clientes
        if (!db.objectStoreNames.contains(STORES.CLIENTES)) {
          db.createObjectStore(STORES.CLIENTES, { keyPath: 'id' })
        }

        // Store de productos
        if (!db.objectStoreNames.contains(STORES.PRODUCTOS)) {
          db.createObjectStore(STORES.PRODUCTOS, { keyPath: 'id' })
        }

        // Store de pedidos sincronizados
        if (!db.objectStoreNames.contains(STORES.PEDIDOS)) {
          const pedidosStore = db.createObjectStore(STORES.PEDIDOS, { keyPath: 'id' })
          pedidosStore.createIndex('fecha', 'fecha', { unique: false })
          pedidosStore.createIndex('clienteId', 'clienteId', { unique: false })
        }

        // Store de pedidos pendientes (creados offline)
        if (!db.objectStoreNames.contains(STORES.PEDIDOS_PENDIENTES)) {
          const pendientesStore = db.createObjectStore(STORES.PEDIDOS_PENDIENTES, { keyPath: 'tempId' })
          pendientesStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Cola de sincronización
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // Guardar múltiples items (usado para cachear datos de Supabase)
  async saveMany(storeName, items) {
    if (!this.db) await this.init()

    const tx = this.db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    for (const item of items) {
      store.put(item)
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Guardar un item
  async save(storeName, item) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.put(item)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Obtener todos los items
  async getAll(storeName) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Obtener un item por ID
  async get(storeName, id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Eliminar un item
  async delete(storeName, id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Limpiar un store completo
  async clear(storeName) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Agregar a la cola de sincronización
  async addToSyncQueue(action, data) {
    return this.save(STORES.SYNC_QUEUE, {
      action, // 'CREATE_PEDIDO', 'UPDATE_PEDIDO', etc.
      data,
      timestamp: Date.now(),
      attempts: 0
    })
  }

  // Obtener cola de sincronización pendiente
  async getSyncQueue() {
    return this.getAll(STORES.SYNC_QUEUE)
  }

  // Limpiar cola de sincronización
  async clearSyncQueue() {
    return this.clear(STORES.SYNC_QUEUE)
  }
}

// Exportar instancia singleton
export const offlineDB = new OfflineDB()
export { STORES }
