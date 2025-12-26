// frontend/src/pages/historial.jsx
import { useEffect, useMemo, useState } from "react";
import { getHistorialStock, getProductos } from "../api";

export default function Historial() {
  const [historial, setHistorial] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productoFiltro, setProductoFiltro] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);
      const [histData, prodData] = await Promise.all([
        getHistorialStock(),
        getProductos(),
      ]);
      setHistorial(histData);
      setProductos(prodData);
    } catch (e) {
      setError(e.message || "Error cargando historial");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const historialEnriquecido = useMemo(() => {
    const mapaProductos = new Map(
      productos.map((p) => [p.id, p.nombre || p.id])
    );

    let datos = historial.map((mov) => ({
      ...mov,
      nombreProducto: mapaProductos.get(mov.productoId) || mov.productoId,
    }));

    if (productoFiltro) {
      datos = datos.filter((m) => m.productoId === productoFiltro);
    }

    // Ordenar por fecha descendente (últimos primero)
    datos.sort((a, b) => {
      const fa = new Date(a.fecha).getTime();
      const fb = new Date(b.fecha).getTime();
      return fb - fa;
    });

    return datos;
  }, [historial, productos, productoFiltro]);

  return (
    <div>
      <h1>Historial de Stock</h1>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: 12 }}>
        <label>Filtrar por producto: </label>
        <select
          value={productoFiltro}
          onChange={(e) => setProductoFiltro(e.target.value)}
        >
          <option value="">Todos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <button type="button" onClick={load} style={{ marginLeft: 8 }}>
          Recargar
        </button>
      </div>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Stock antes</th>
            <th>Stock después</th>
          </tr>
        </thead>
        <tbody>
          {historialEnriquecido.map((mov) => (
            <tr key={mov.id}>
              <td>
                {new Date(mov.fecha).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
              <td>{mov.nombreProducto}</td>
              <td>{mov.tipoMovimiento}</td>
              <td>{mov.cantidad}</td>
              <td>{mov.stockAntes}</td>
              <td>{mov.stockDespues}</td>
            </tr>
          ))}

          {!loading && historialEnriquecido.length === 0 && (
            <tr>
              <td colSpan="6">No hay movimientos de stock aún.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
