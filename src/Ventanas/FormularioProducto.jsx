import { useState, useEffect } from "react";
import Producte from '../clases/Producte'; 
import indexedBBDD from '../funcionalitats/indexedDB'; 

const FormularioProducto = ({ onClose, onProductosActualizados }) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [color, setColor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [productos, setProductos] = useState([]); //Llista de productos
  const [productoSeleccionado, setProductoSeleccionado] = useState(null); // Variable per saber si s'actualitza o es guarda un producte

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const productosGuardados = await indexedBBDD.obtenerProductos();
      setProductos(productosGuardados);
    } catch (error) {
      console.error("Error al obtener los productos: ", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (productoSeleccionado) {
      await actualizarProducto();
    } else {
      await guardarNuevoProducto();
    }
  };

  const guardarNuevoProducto = async () => {
    const producto = new Producte(nombre, precio, color, categoria);
    try {
      await indexedBBDD.guardarProducto(producto);
      resetFormulario();
      cargarProductos();
      onProductosActualizados();
    } catch (error) {
      alert('Error al guardar el producto');
    }
  };

  const actualizarProducto = async () => {
    try {
      const productoActualizado = {
        ...productoSeleccionado,
        nom: nombre,
        preu: parseFloat(precio),
        color: color,
        categoria: categoria,
      };

      await indexedBBDD.eliminarProducto(productoSeleccionado.id);
      await indexedBBDD.guardarProducto(productoActualizado);

      resetFormulario();
      cargarProductos();
      onProductosActualizados();
    } catch (error) {
      alert('Error al actualizar el producto');
    }
  };

  const eliminarProducto = async (id) => {
    try {
      await indexedBBDD.eliminarProducto(id);
      cargarProductos();
      onProductosActualizados();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setNombre(producto.nom);
    setPrecio(producto.preu);
    setColor(producto.color);
    setCategoria(producto.categoria);
  };

  const resetFormulario = () => {
    setNombre('');
    setPrecio('');
    setColor('');
    setCategoria('');
    setProductoSeleccionado(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre del producto:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Precio:</label>
        <input
          type="number"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Categoría:</label>
        <input
          type="text"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
        />
      </div>
      
      <button type="submit">{productoSeleccionado ? "Actualizar Producto" : "Guardar Producto"}</button>
      <button onClick={onClose}>Cancelar</button>

      {/* Lista de productos */}
      <div>
        <h2>Productos guardados</h2>
        <ul>
          {productos.map((producto) => (
            <li key={producto.id}>
              <span onClick={() => seleccionarProducto(producto)} style={{ cursor: "pointer" }}>
                {producto.nom} - ${producto.preu}  - {producto.categoria}
              </span>
              <button type="button" onClick={(e) => { e.preventDefault(); eliminarProducto(producto.id);}}
                className="eliminar-button"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
};

export default FormularioProducto;