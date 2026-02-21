import { useState, useEffect } from "react";
import indexedBBDD from "./funcionalitats/indexedDB";
import ExcelJS from "exceljs";
import { Filesystem, Directory } from '@capacitor/filesystem';;
import FormularioProducto from "./Ventanas/FormularioProducto";
import { motion, AnimatePresence } from "framer-motion"; //Para la animacion
import Prod from "./clases/Producte";

function App() {
  const [sales, setSales] = useState({});
  const [ventasDefinitivas, setVentasDefinitivas] = useState([]);
  const [bizumSeleccionado, setBizumSeleccionado] = useState("");
  const [otrosTexto, setOtrosTexto] = useState("");
  const [otrosValor, setOtrosValor] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [mostrarVentas, setMostrarVentas] = useState(false); //Si esta o no desplegado el listado de ventas
  const opcionesBizum = ["", "Detafono", "Bizum Carla", "Bizum Eva"];
  const [nombreVenta, setNombreVenta] = useState("");
  const [titulo, setTitulo] = useState("VERMUT");
  const [modoOscuro, setModoOscuro] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productos, setProductos] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null); //Para saber si se ha seleccionado o no una venta creada
  let cargaInicial = false;



  useEffect(() => {
    indexedBBDD.obtenerVentas().then(setVentasDefinitivas);
    const guardado = localStorage.getItem('modoOscuro');
    if (guardado === '1') setModoOscuro(true);

    cargarProductos();

  }, []);

  const cargarProductos = async () => {
    try {
      const productosGuardados = await indexedBBDD.obtenerProductos();
      if (productosGuardados.length === 0 && !cargaInicial) {
        const productosIniciales = [
          new Prod('Agua', 1, 'Rojo', 'Agua'),
          new Prod('Vermut', 3, 'Azul', 'Vermut'),
          new Prod('Taronjada', 2.50, 'Verde', 'Natural'),
          new Prod('Llimonada', 2.50, 'Rojo', 'Natural'),
          new Prod('Coca-cola N', 2.50, 'Azul', 'Cocacola'),
          new Prod('Coca-cola 0', 2.50, 'Verde', 'Cocacola'),
          new Prod('S pressec', 2.50, 'Azul', 'Suc'),
          new Prod('S piña', 2.50, 'Azul', 'Suc'),
          new Prod('S taronja', 2.50, 'Rojo', 'Suc'),
          new Prod('Olives', 1.50, 'Azul', 'Olives'),
          new Prod('Patates', 1.50, 'Verde', 'Patates'),
          new Prod('Estrella Dam', 2.50, 'Azul', 'Birra'),
          new Prod('Daura', 2.50, 'Azul', 'Birra'),
          new Prod('Damm lemon', 2.50, 'Azul', 'Birra'),
          new Prod('Free Damm', 2.50, 'Verde', 'Free'),
          new Prod('Free Damm torrada', 2.50, 'Azul', 'Free'),
          new Prod('Turia', 3, 'Azul', 'Tostada'),
          new Prod('IPA', 3, 'Azul', 'Tostada')
        ];

        cargaInicial = true;  // Marca que la carga inicial se ha realizado

        for (let producto of productosIniciales) {
          await indexedBBDD.guardarProducto(producto);
        }

        // Obtén los productos después de haberlos agregado
        const productosActualizados = await indexedBBDD.obtenerProductos();

        setProductos(productosActualizados);  // Actualiza el estado

      } else {
        cargaInicial = true;  // Marca que la carga inicial se ha realizado
        setProductos(productosGuardados);  // Actualiza el estado
      }
    } catch (error) {
      setMensaje(`❌ Error al obtener los productos`);
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

  const seleccionarVenta = (venta) => {
    setVentaSeleccionada(venta);
    const newSales = {};
    venta.productos.forEach((p) => {
      const product = productos.find((prod) => prod.nom === p.name && prod.preu === p.price);
      if (product) newSales[product.id] = p.quantity;
    });
    setSales(newSales);
    setNombreVenta(venta.nombre || "");
    const otrosProducto = venta.productos.find(p => p.name === "Otros" || !productos.some(prod => prod.nom === p.name));
    setOtrosTexto(otrosProducto ? otrosProducto.name : "");
    setOtrosValor(otrosProducto ? otrosProducto.price : 0);
    setBizumSeleccionado(venta.bizum || "");
  };

  const cancelarEdicion = () => {
    setVentaSeleccionada(null);
    setNombreVenta("");
    setSales({});
    setOtrosTexto("");
    setOtrosValor(0);
    setBizumSeleccionado("");
  };

  const registrarVenta = async () => {
    const hayProductos = Object.keys(sales).length > 0;
    const hayOtros = parseFloat(otrosValor) > 0;
    const hayTextoOtros = otrosTexto.trim() !== "";

    if (!hayProductos && !hayOtros) return;



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
      if (ventaSeleccionada) {
        const id = await indexedBBDD.actualizarVenta(ventaSeleccionada.id, nuevaVenta);
        setVentasDefinitivas((prev) =>
          prev.map((venta) =>
            venta.id === ventaSeleccionada.id ? { ...nuevaVenta, id: ventaSeleccionada.id } : venta
          )
        );
      } else {
        const id = await indexedBBDD.guardarVenta(nuevaVenta);
        setVentasDefinitivas((prev) => [...prev, { ...nuevaVenta, id }]);
      }
      cancelarEdicion();
      const productosTexto = productosSeleccionados
        .map(p => `${p.name} ${p.price}€ x${p.quantity}`)
        .join(', ');
      setMensaje(`✅ Venta: ${productosTexto}`);
      setTimeout(() => {
        setMensaje("");
      }, 6000);
    } catch (err) {
      setMensaje(`❌ Error al registrar venta`);
    }
  };

  const eliminarVenta = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta venta?")) return;
    try {
      await indexedBBDD.eliminarVenta(id); // usa la función de indexedDB.js
      setVentasDefinitivas((prev) => prev.filter((v) => v.id !== id)); //
    } catch (err) {
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

  const productosPorCategoria = productos.reduce((acc, p) => {
  acc[p.categoria] = acc[p.categoria] || [];
  acc[p.categoria].push(p);
  return acc;
}, {});

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
        {modoOscuro ? "🌙" : "☀️"}
      </button>
      <div className={`left-column ${mostrarVentas ? 'estrecha' : 'ancha'}`}>
        <input className="titulo-editable" value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />


        <div className="products-grid">
          {Object.entries(productosPorCategoria).map(([categoria, items]) => (
            items.length > 1 ? (
              // Categorías repetidas → agrupadas
              <div key={categoria} className="product-box-aros">
                {items.map(product => (
                  <button
                    key={product.id}
                    className="arosButton"
                    onClick={() => addSale(product.id)}
                    style={{ flex: 1 }}
                  >
                    {product.nom}<br />{product.preu}€: {sales[product.id] || 0}
                  </button>
                ))}
              </div>
            ) : (
              // Categorías únicas → individuales
              <button
                key={items[0].id}
                className="product-box"
                onClick={() => addSale(items[0].id)}
              >
                {items[0].nom} {items[0].preu}€<br />{sales[items[0].id] || 0}
              </button>
            )
          ))}
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
          <AnimatePresence>
            {mostrarFormulario && (<motion.div
              initial={{ opacity: 0, y: -0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -0 }}
              transition={{ duration: 0.5 }}
              className="modal-overlay"
            >
              <div className="modal-overlay" onClick={handleOcultarFormulario}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                  <FormularioProducto onClose={handleOcultarFormulario} onProductosActualizados={cargarProductos} />

                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="Opciones">
          <label className="tipoPagoLabel" htmlFor="tipoPago"> Pago con</label>
          <select className="tipoPagoSelect" id="tipoPago" value={bizumSeleccionado} onChange={(e) => setBizumSeleccionado(e.target.value)}>
            {opcionesBizum.map((op) => (
              <option key={op} value={op}>{op || "efectivo"}</option>
            ))}
          </select>
        </div>

        <div className="OtrosPagos">
          <label className="NombreLabel" htmlFor="Otros">Otros</label>
          <input
            className="nombreOtroPagoImput"
            id="Otros"
            type="text"
            placeholder=" Info extra"
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
            {ventaSeleccionada ? "Actualizar Venta" : "Registrar Venta"}
          </button>

          {ventaSeleccionada && <button onClick={cancelarEdicion}>Cancelar Edición</button>}

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
                <li key={venta.id} onClick={() => seleccionarVenta(venta)}>
                  {venta.nombre}{" "}
                  {venta.productos.map((p) => `${p.quantity}x ${p.name} ${p.price}€ `).join(", ")}{" "}
                  - {venta.totalPrecio}€
                  {venta.bizum && ` (${venta.bizum})`}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que el evento de seleccionar se dispare
                      eliminarVenta(venta.id);
                    }}
                    className="eliminar-button">X</button>
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
