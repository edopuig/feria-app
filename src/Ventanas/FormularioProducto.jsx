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
      setMensaje(`❌ Error al obtener los productos`);
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
      setMensaje(`❌ Error al eliminar producto`);
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
    <div className="formulario-producto-container" >
      <form className="formulario" onSubmit={handleSubmit}>
        <div>
          <label className="NombreProductLabel">Nombre del producto:</label>
          <input className="ProductInput" type="text" placeholder="Nombre del producto" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>

        <div>
          <label>Precio:</label>
          <input className="ProductInput" type="number" placeholder="€" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
        </div>

        <div>
          <label>Categoría:</label>
          <input className="ProductInput" type="text" placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} required />
        </div>

        <div>
          <button type="button" onClick={resetFormulario} className="boton-cancelarProducto">
            Limpiar
          </button>
          <button type="submit" className="boton-gauardarProducto">
            {productoSeleccionado ? "Actualizar Producto" : "Guardar Producto"}
          </button>
        </div>

      </form>

      <div className="productos-list">
        <h2>Productos guardados</h2>
        <ol>
          {productos.map((producto) => (
            <li key={producto.id}>
              <button className="productos-buttons" onClick={() => seleccionarProducto(producto)}>
                {producto.nom} - {producto.preu}€ - {producto.categoria}
              </button>
              <button className="productos-buttons eliminar-button" onClick={() => eliminarProducto(producto.id)}>X</button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default FormularioProducto;