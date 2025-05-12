const DB_NAME = "feriaDB";
const DB_VERSION = 1;
const STORE_NAME = "ventas";
const PRODUCTOS = "productos"

const indexedBBDD = {
  openDB: function () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject("Error al abrir IndexedDB");

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(PRODUCTOS)) {
          db.createObjectStore(PRODUCTOS, { keyPath: "id" , autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
    });
  },

  guardarProducto: async function (venta) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRODUCTOS, "readwrite");
      const store = tx.objectStore(PRODUCTOS);
      
      const request = store.add(venta);
      request.onsuccess = () => resolve(request.result); // el ID generado
      request.onerror = () => reject("Error al guardar la venta");
    });
  },

  obtenerProductos: async function () {
    const db = await this.openDB();
    const tx = db.transaction(PRODUCTOS, "readonly");
    const store = tx.objectStore(PRODUCTOS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject("Error al leer productos");
    });
  },

  eliminarProducto: async function (id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRODUCTOS, "readwrite");
      const store = tx.objectStore(PRODUCTOS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Error al eliminar la venta");
    });
  },

  guardarVenta: async function (venta) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(venta);

      request.onsuccess = () => resolve(request.result); // el ID generado
      request.onerror = () => reject("Error al guardar la venta");
    });
  },

  obtenerVentas: async function () {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject("Error al leer ventas");
    });
  },

  eliminarVenta: async function (id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Error al eliminar la venta");
    });
  },

  limpiarDB: async function () {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      localStorage.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject("Error al limpiar la base de datos");

    });
  }

};

export default indexedBBDD;