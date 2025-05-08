import { useState, useEffect } from "react";
import indexedBBDD from "./funcionalitats/indexedDB";
import ExcelJS from "exceljs";
import { Filesystem, Directory } from '@capacitor/filesystem';;
import FormularioProducto from "./Ventanas/FormularioProducto";

function App() {
  const [sales, setSales] = useState({});
  const [ventasDefinitivas, setVentasDefinitivas] = useState([]);
  const [bizumSeleccionado, setBizumSeleccionado] = useState("");
  const [otrosTexto, setOtrosTexto] = useState("");
  const [otrosValor, setOtrosValor] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [mostrarVentas, setMostrarVentas] = useState(true); //Si esta o no desplegado el listado de ventas
  const opcionesBizum = ["", "Bizum Marta", "Bizum Chari", "Bizum Edo", "Bizum Carla"];
  const [nombreVenta, setNombreVenta] = useState("");
  const [titulo, setTitulo] = useState("FERIA");
  const [modoOscuro, setModoOscuro] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productos, setProductos] = useState([]);


  useEffect(() => {
    indexedBBDD.obtenerVentas().then(setVentasDefinitivas);
    const guardado = localStorage.getItem('modoOscuro');
    if (guardado === '1') setModoOscuro(true);

    cargarProductos();

  }, []);

  const cargarProductos = async () => {
    try {
      const productosGuardados = await indexedBBDD.obtenerProductos(); // Llista dels obj Producte ja creats
      setProductos(productosGuardados);  // Actualizamos el estado con los productos obtenidos
    } catch (error) {
      console.error("Error al obtener los productos: ", error);
    }
  };

  const addSale = (productId) => {
    setSales((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const getTotal = () => {
    const totalProductos = productos.reduce(
      (sum, p) => sum + (sales[p.id] || 0) * p.preu,
      0
    );
    return totalProductos + parseFloat(otrosValor || 0); // Añade el valor de "otros"
  };

  const registrarVenta = async () => {
    const hayProductos = Object.keys(sales).length > 0;
    const hayOtros = parseFloat(otrosValor) > 0;
    const hayTextoOtros = otrosTexto.trim() !== "";

    if (!hayProductos && !hayOtros) return;

    console.log('storeProducte:', ventasDefinitivas);

    const productosSeleccionados = productos
      .filter((product) => sales[product.id] > 0)
      .map((product) => ({
        name: product.nom,
        quantity: sales[product.id],
        price: product.preu,
      }));

    if (hayOtros || hayTextoOtros) {
      if (otrosTexto.trim() !== "") {
        productosSeleccionados.push({
          name: otrosTexto,
          quantity: 1,
          price: parseFloat(otrosValor),
        });
      } else {
        productosSeleccionados.push({
          name: "Otros",
          quantity: 1,
          price: parseFloat(otrosValor),
        });
      }
    }

    const totalPrecio = productosSeleccionados.reduce(
      (total, p) => total + p.price * p.quantity,
      0
    );

    const nuevaVenta = {
      nombre: nombreVenta || "",
      productos: productosSeleccionados,
      totalPrecio,
      bizum: bizumSeleccionado || null,
    };

    try {
      const id = await indexedBBDD.guardarVenta(nuevaVenta);
      setVentasDefinitivas((prev) => [...prev, { ...nuevaVenta, id }]);
      setSales({});
      setBizumSeleccionado("");
      setOtrosTexto("");
      setOtrosValor(0);
      setNombreVenta("");
      const productosTexto = productosSeleccionados
        .map(p => `${p.name} ${p.price}€ x${p.quantity}`)
        .join(', ');
      setMensaje(`✅ Venta: ${productosTexto}`);
      setTimeout(() => {
        setMensaje("");
      }, 6000);
    } catch (err) {
      console.error("Error al guardar venta:", err);
      setMensaje(`❌ Error al registrar venta`);
    }
  };

  const eliminarVenta = async (id) => {
    try {
      await indexedBBDD.eliminarVenta(id); // usa la función de indexedDB.js
      setVentasDefinitivas((prev) => prev.filter((v) => v.id !== id)); //
    } catch (err) {
      console.error("Error al eliminar venta:", err);
      setMensaje("❌ Error al eliminar venta");
    }
  };

  const checkAndRequestPermissions = async () => {
    const permissions = await Filesystem.checkPermissions();
    if (permissions.publicStorage !== 'granted') {
      await Filesystem.requestPermissions();
    }
  };

  const exportarExcel = async () => {
    try {
      await checkAndRequestPermissions();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Ventas");

      worksheet.columns = [
        { header: "Nombre", key: "nombre", width: 20 },
        { header: "Productos", key: "productos", width: 70 },
        { header: "Total (€)", key: "total", width: 15, style: { numFmt: '#,##0.00' } },
        { header: "Método de pago", key: "pago", width: 20 },
      ];

      let totalVentas = 0;

      ventasDefinitivas.forEach((venta) => {
        const productosTexto = venta.productos
          .map((p) => `${p.name} ${p.price}€ x${p.quantity}`)
          .join(", ");
        const total = venta.productos.reduce((sum, p) => sum + p.price * p.quantity, 0);

        worksheet.addRow({
          nombre: venta.nombre || "",
          productos: productosTexto,
          total: parseFloat(total.toFixed(2)),
          pago: venta.bizum || "Efectivo",
        });

        totalVentas += total;
      });

      // Agregar la fila de total general
      worksheet.addRow({ nombre: "TOTAL", total: parseFloat(totalVentas.toFixed(2)) });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const base64 = await blobToBase64(blob);

      await Filesystem.writeFile({
        path: `${titulo}.xlsx`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });

      alert(`✅ Excel guardado en Documentos: ${titulo}`);
    } catch (error) {
      console.error("Error al guardar el archivo:", error);
      alert("❌ Error al guardar archivo");
    }
  };

  // Utilidad para convertir Blob a Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };


  const limpiarTodo = async () => {
    if (!window.confirm("¿Seguro que quieres borrar todo?")) return;

    try {

      for (const venta of ventasDefinitivas) { //Eliminamos todas las ventas y tambien limpia memoria.
        await indexedBBDD.eliminarVenta(venta.id);
      }
      await indexedBBDD.limpiarDB();

      setVentasDefinitivas([]);
      setSales({});
      setTitulo("FERIA");
      setOtrosTexto("");
      setOtrosValor(0);
      setBizumSeleccionado("");
      setMensaje("✅ Datos borrados");
      setTimeout(() => setMensaje(""), 4000);
      setNombreVenta("");
    } catch (err) {
      console.error("Error al limpiar todo:", err);
      setMensaje("❌ Error al limpiar datos");
    }
  };

  const handleMostrarFormulario = () => {
    setMostrarFormulario(true);
  };

  // Función para ocultar el formulario
  const handleOcultarFormulario = () => {
    setMostrarFormulario(false);
  };

  return (
    <div className={`app-container ${modoOscuro ? 'dark' : ''}`}>
      <button className="boton-reset" onClick={limpiarTodo}>
        Limpiar Todo
      </button>

      <button className="boton-modoOscuro" onClick={() => {
        const nuevoModo = !modoOscuro;
        setModoOscuro(nuevoModo);
        localStorage.setItem('modoOscuro', nuevoModo ? '1' : '0');
      }}
      >
        {modoOscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
      </button>
      <div className={`left-column ${mostrarVentas ? 'estrecha' : 'ancha'}`}>
        <input className="titulo-editable" value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <div className="products-grid">
          {/* Botones agrupados para "aros" */}
          <div className="product-box-aros">
            {productos.filter(p => p.categoria === 'Aro').map((product) => (
              <button
                className="arosButton"
                key={product.id}
                onClick={() => addSale(product.id)}
                style={{ flex: 1 }}
              >
                {product.nom} <br></br>{product.preu}€: {sales[product.id] || 0}
              </button>
            ))}
          </div>

          {/* Otros productos */}
          {productos.filter(p => p.categoria !== 'Aro').map((product) => (
            <button
              key={product.id}
              className="product-box"
              onClick={() => addSale(product.id)}
            >
              {product.nom} {product.preu}€: <br></br>{sales[product.id] || 0}
            </button>
          ))}
        </div>

        <div className="OtrosPagos">
          <label className="NombreLabel" htmlFor="Otros">Otros</label>
          <input
            className="nombreOtroPagoImput"
            id="Otros"
            type="text"
            placeholder="Pagos extra"
            value={otrosTexto}
            onChange={(e) => setOtrosTexto(e.target.value)}
          />
          <input
            className="OtroPagoImput"
            id="Otros2"
            type="number"
            placeholder="€"
            value={otrosValor}
            onChange={(e) => setOtrosValor(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="Opciones">
          <label className="NombreLabel" htmlFor="nombre">Nombre</label>
          <input
            className="nombreImput"
            id="nombre"
            type="text"
            placeholder="Nombre persona"
            value={nombreVenta}
            onChange={(e) => setNombreVenta(e.target.value)}
          />

          <button className="MostrarProductos" onClick={handleMostrarFormulario}>Mostrar Productos</button>

          {mostrarFormulario && (
            <div className="modal-overlay" onClick={handleOcultarFormulario}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                <FormularioProducto onClose={handleOcultarFormulario} onProductosActualizados={cargarProductos} />

              </div>
            </div>
          )}
        </div>

        <div className="Opciones">
          <label className="tipoPagoLabel" htmlFor="tipoPago"> Pago con</label>
          <select className="tipoPagoSelect" id="tipoPago" value={bizumSeleccionado} onChange={(e) => setBizumSeleccionado(e.target.value)}>
            {opcionesBizum.map((op) => (
              <option key={op} value={op}>{op || "efectivo"}</option>
            ))}
          </select>
        </div>

        <div className="buttons-grid">
          <button className="boton-limpiar" onClick={() => {
            setSales({});
            setOtrosTexto("");
            setOtrosValor(0);
            setBizumSeleccionado("");
            setNombreVenta("");
          }}>
            Limpiar
          </button>
          <div className="total">TOTAL: {getTotal()}€</div>
          <button className="boton-registrar" onClick={registrarVenta}>
            Registrar Venta
          </button>
        </div>
        {mensaje && <div style={{ color: "green", marginTop: "10px" }}>{mensaje}</div>}


      </div>

      <div className={`right-column ${!mostrarVentas ? 'oculta' : ''}`}>
        <button onClick={() => setMostrarVentas(!mostrarVentas)}>
          {mostrarVentas ? "Ocultar ventas" : "Mostrar ventas"}
        </button>
        {mostrarVentas && (
          <>
            <h3>Ventas registradas</h3>
            <ol>
              {ventasDefinitivas.map((venta) => (
                <li key={venta.id}>
                  {venta.productos.map((p) => `${p.name} ${p.price}€ x${p.quantity}`)
                    .join(", ")}{" "}
                  - {venta.totalPrecio}€
                  {venta.bizum && ` (${venta.bizum})`}
                  <button onClick={() => eliminarVenta(venta.id)} className="eliminar-button">X</button>
                </li>
              ))}
            </ol>
            <button onClick={exportarExcel} className="exportar-button">
              Exportar a Excel
            </button>
          </>
        )}
      </div>
    </div>
  );
}


export default App
