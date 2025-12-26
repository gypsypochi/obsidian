// frontend/src/pages/pedidos.jsx
import { useEffect, useMemo, useState } from "react";
import { getProductos, getPedidos, createPedido, updatePedido } from "../api";

const ESTADOS = [
  "pendiente",
  "en_produccion",
  "listo",
  "entregado",
  "cancelado",
];

export default function Pedidos() {
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState({
    cliente: "",
    productoId: "",
    cantidad: 1,
    notas: "",
    fechaLimite: "",
    canal: "",
    urgente: false,
  });

  async function load() {
    try {
      setError("");
      setLoading(true);
      const [prodData, pedData] = await Promise.all([
        getProductos(),
        getPedidos(),
      ]);
      setProductos(prodData);
      setPedidos(pedData);
    } catch (e) {
      setError(e.message || "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "cantidad"
          ? Number(value)
          : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!form.productoId) {
      setError("Tenés que elegir un producto");
      return;
    }

    if (!form.cantidad || form.cantidad <= 0) {
      setError("Cantidad debe ser mayor a 0");
      return;
    }

    try {
      const payload = {
        cliente: form.cliente,
        productoId: form.productoId,
        cantidad: form.cantidad,
        notas: form.notas,
        fechaLimite: form.fechaLimite || null,
        canal: form.canal || null,
        urgente: form.urgente,
      };

      await createPedido(payload);

      setMensaje("Pedido creado correctamente.");
      setForm({
        cliente: "",
        productoId: "",
        cantidad: 1,
        notas: "",
        fechaLimite: "",
        canal: "",
        urgente: false,
      });

      await load();
    } catch (e) {
      setError(e.message || "Error creando pedido");
    }
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyMs = hoy.getTime();

  const pedidosEnriquecidos = useMemo(() => {
    const mapaProductos = new Map(productos.map((p) => [p.id, p]));
    let lista = pedidos.map((ped) => {
      const item = ped.items && ped.items[0];
      const prod = item ? mapaProductos.get(item.productoId) : null;

      return {
        ...ped,
        productoNombre: prod ? prod.nombre : item?.productoId,
        cantidad: item?.cantidad ?? 0,
        urgente: Boolean(ped.urgente),
      };
    });

    // Filtrar: solo pedidos activos (no entregados ni cancelados)
    lista = lista.filter(
      (p) => p.estado !== "entregado" && p.estado !== "cancelado"
    );

    // Ordenar:
    // 1) urgentes primero
    // 2) por fecha límite (más cercana)
    // 3) sin fecha límite, por fecha de creación (más nuevos arriba)
    lista.sort((a, b) => {
      // urgentes arriba
      if (a.urgente && !b.urgente) return -1;
      if (!a.urgente && b.urgente) return 1;

      const fa = a.fechaLimite ? new Date(a.fechaLimite).getTime() : null;
      const fb = b.fechaLimite ? new Date(b.fechaLimite).getTime() : null;

      if (fa && fb) {
        return fa - fb;
      }
      if (fa && !fb) return -1;
      if (!fa && fb) return 1;

      const ca = new Date(a.fechaCreacion).getTime();
      const cb = new Date(b.fechaCreacion).getTime();
      return cb - ca;
    });

    return lista;
  }, [pedidos, productos]);

  const resumen = useMemo(() => {
    let activos = 0;
    let vencidos = 0;
    let paraHoy = 0;
    let proximos3 = 0;

    pedidosEnriquecidos.forEach((ped) => {
      const esCerrado =
        ped.estado === "entregado" || ped.estado === "cancelado";

      if (!esCerrado) {
        activos++;
      }

      if (!ped.fechaLimite || esCerrado) return;

      const fLim = new Date(ped.fechaLimite);
      fLim.setHours(0, 0, 0, 0);
      const diffDias = Math.round(
        (fLim.getTime() - hoyMs) / (1000 * 60 * 60 * 24)
      );

      if (diffDias < 0 && !esCerrado) {
        vencidos++;
      } else if (diffDias === 0 && !esCerrado) {
        paraHoy++;
      } else if (diffDias > 0 && diffDias <= 3 && !esCerrado) {
        proximos3++;
      }
    });

    return { activos, vencidos, paraHoy, proximos3 };
  }, [pedidosEnriquecidos, hoyMs]);

  async function cambiarEstado(pedido, nuevoEstado) {
    setError("");
    setMensaje("");

    if (pedido.estado === nuevoEstado) return;

    if (nuevoEstado === "entregado") {
      const confirmar = window.confirm(
        "Marcar como ENTREGADO va a descontar stock y registrar una venta.\n¿Estás segura?"
      );
      if (!confirmar) return;
    }

    try {
      await updatePedido(pedido.id, { estado: nuevoEstado });
      setMensaje(`Estado de pedido actualizado a ${nuevoEstado}.`);
      await load();
    } catch (e) {
      setError(e.message || "Error actualizando pedido");
    }
  }

  async function toggleUrgente(pedido) {
    setError("");
    setMensaje("");
    try {
      await updatePedido(pedido.id, { urgente: !pedido.urgente });
      await load();
    } catch (e) {
      setError(e.message || "Error actualizando urgencia");
    }
  }

  return (
    <div>
      <h1>Pedidos</h1>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}

      <h2>Resumen rápido</h2>
      <ul>
        <li>Pedidos activos: {resumen.activos}</li>
        <li>Vencidos: {resumen.vencidos}</li>
        <li>Para hoy: {resumen.paraHoy}</li>
        <li>Próximos 3 días: {resumen.proximos3}</li>
      </ul>

      <h2>Nuevo pedido</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Cliente</label>
          <input
            name="cliente"
            value={form.cliente}
            onChange={onFormChange}
            placeholder="Nombre del cliente o referencia"
          />
        </div>

        <div>
          <label>Producto *</label>
          <select
            name="productoId"
            value={form.productoId}
            onChange={onFormChange}
            required
          >
            <option value="">-- elegir producto --</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Cantidad *</label>
          <input
            name="cantidad"
            type="number"
            min="1"
            value={form.cantidad}
            onChange={onFormChange}
          />
        </div>

        <div>
          <label>Notas</label>
          <textarea
            name="notas"
            value={form.notas}
            onChange={onFormChange}
            placeholder="Detalles del pedido, diseños, colores, etc."
          />
        </div>

        <div>
          <label>Fecha límite de entrega</label>
          <input
            type="date"
            name="fechaLimite"
            value={form.fechaLimite}
            onChange={onFormChange}
          />
        </div>

        <div>
          <label>Canal (Instagram, Feria, WhatsApp, etc.)</label>
          <input
            name="canal"
            value={form.canal}
            onChange={onFormChange}
            placeholder="Ej: Instagram, Feria, Local..."
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              name="urgente"
              checked={form.urgente}
              onChange={onFormChange}
            />{" "}
            Marcar como urgente
          </label>
        </div>

        <button type="submit">Crear pedido</button>
        <button type="button" onClick={load} style={{ marginLeft: 8 }}>
          Recargar
        </button>
      </form>

      <h2>Lista de pedidos activos</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Urgente</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Canal</th>
            <th>Notas</th>
            <th>Fecha límite</th>
          </tr>
        </thead>
        <tbody>
          {pedidosEnriquecidos.map((ped) => {
            const fLim = ped.fechaLimite ? new Date(ped.fechaLimite) : null;
            let esVencido = false;
            if (fLim) {
              fLim.setHours(0, 0, 0, 0);
              esVencido = fLim.getTime() < hoyMs;
            }

            const rowStyle = esVencido
            ? {
                backgroundColor: "#fecaca",   // rojo un poco más fuerte
                color: "#7f1d1d",             // texto rojo oscuro
                fontWeight: "600",            // un poquito más grueso
                }
            : undefined;


            return (
              <tr key={ped.id} style={rowStyle}>
                <td>
                  <input
                    type="checkbox"
                    checked={ped.urgente}
                    onChange={() => toggleUrgente(ped)}
                    title="Marcar/desmarcar urgente"
                  />
                </td>
                <td>
                  {new Date(ped.fechaCreacion).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td>{ped.cliente || "-"}</td>
                <td>{ped.productoNombre}</td>
                <td>{ped.cantidad}</td>
                <td>
                  <select
                    value={ped.estado}
                    onChange={(e) => cambiarEstado(ped, e.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{ped.canal || "-"}</td>
                <td>{ped.notas || "-"}</td>
                <td>
                  {ped.fechaLimite
                    ? new Date(ped.fechaLimite).toLocaleDateString("es-AR")
                    : "-"}
                </td>
              </tr>
            );
          })}

          {!loading && pedidosEnriquecidos.length === 0 && (
            <tr>
              <td colSpan="9">No hay pedidos activos.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
