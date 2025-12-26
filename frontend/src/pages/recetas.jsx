import { useEffect, useMemo, useState } from "react";
import {
  getRecetas,
  createReceta,
  updateReceta,
  deleteReceta,
  getProductos,
  getMateriales,
} from "../api";

export default function Recetas() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Alta
  const [form, setForm] = useState({
    productoId: "",
    materialId: "",
    cantidad: 0,
    unidad: "",
    tipoProduccion: "unidad", // NUEVO
  });

  // Filtro (por productoId o nombre)
  const [q, setQ] = useState("");

  // Edición
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    productoId: "",
    materialId: "",
    cantidad: 0,
    unidad: "",
    tipoProduccion: "unidad", // NUEVO
  });

  async function loadAll() {
    try {
      setError("");
      setLoading(true);

      const [recetasData, productosData, materialesData] = await Promise.all([
        getRecetas(),
        getProductos(),
        getMateriales(),
      ]);

      setRecetas(recetasData);
      setProductos(productosData);
      setMateriales(materialesData);
    } catch (e) {
      setError(e.message || "Error cargando recetas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "cantidad" ? Number(value) : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError("");

      if (!form.productoId || !form.materialId) {
        throw new Error("Debe seleccionar producto y material");
      }

      await createReceta(form);
      setForm({
        productoId: "",
        materialId: "",
        cantidad: 0,
        unidad: "",
        tipoProduccion: "unidad",
      });
      await loadAll();
    } catch (e) {
      setError(e.message || "Error creando receta");
    }
  }

  function startEdit(r) {
    setEditId(r.id);
    setEditForm({
      productoId: r.productoId || "",
      materialId: r.materialId || "",
      cantidad: Number(r.cantidad || 0),
      unidad: r.unidad || "",
      tipoProduccion: r.tipoProduccion || "unidad",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({
      productoId: "",
      materialId: "",
      cantidad: 0,
      unidad: "",
      tipoProduccion: "unidad",
    });
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "cantidad" ? Number(value) : value,
    }));
  }

  async function saveEdit() {
    try {
      setError("");

      if (!editForm.productoId || !editForm.materialId) {
        throw new Error("Debe seleccionar producto y material");
      }

      await updateReceta(editId, editForm);
      cancelEdit();
      await loadAll();
    } catch (e) {
      setError(e.message || "Error actualizando receta");
    }
  }

  async function onDelete(id) {
    const ok = window.confirm("¿Eliminar esta receta?");
    if (!ok) return;

    try {
      setError("");
      await deleteReceta(id);
      await loadAll();
    } catch (e) {
      setError(e.message || "Error eliminando receta");
    }
  }

  function findProducto(id) {
    return productos.find((p) => p.id === id);
  }

  function findMaterial(id) {
    return materiales.find((m) => m.id === id);
  }

  const recetasFiltradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return recetas;

    return recetas.filter((r) => {
      const prod = findProducto(r.productoId);
      const nombreProd = prod?.nombre || "";
      return (
        String(r.productoId || "").toLowerCase().includes(term) ||
        nombreProd.toLowerCase().includes(term)
      );
    });
  }, [recetas, q, productos]);

  function labelTipo(tipo) {
    if (tipo === "lote") return "Por lote/plancha";
    return "Por unidad";
  }

  return (
    <div>
      <h1>Recetas (Producto ↔ Materiales)</h1>

      <p>
        <strong>Tipo de producción:</strong> usar{" "}
        <em>"Por unidad"</em> para cuadernos u otros productos fijos,
        y <em>"Por lote/plancha"</em> para stickers u otros que trabajes
        por tirada.
      </p>

      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}

      <h2>Alta</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Producto *</label>
          <select
            name="productoId"
            value={form.productoId}
            onChange={onChange}
            required
          >
            <option value="">-- seleccionar producto --</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Tipo de producción *</label>
          <select
            name="tipoProduccion"
            value={form.tipoProduccion}
            onChange={onChange}
            required
          >
            <option value="unidad">Por unidad (cuadernos, etc.)</option>
            <option value="lote">Por lote/plancha (stickers, etc.)</option>
          </select>
        </div>

        <div>
          <label>Material *</label>
          <select
            name="materialId"
            value={form.materialId}
            onChange={onChange}
            required
          >
            <option value="">-- seleccionar material --</option>
            {materiales.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Cantidad</label>
          <input
            name="cantidad"
            type="number"
            value={form.cantidad}
            onChange={onChange}
          />
        </div>

        <div>
          <label>Unidad</label>
          <input
            name="unidad"
            value={form.unidad}
            onChange={onChange}
            placeholder="Ej: planchas / hojas / u"
          />
        </div>

        <button type="submit">Crear</button>
        <button type="button" onClick={loadAll}>
          Recargar
        </button>
      </form>

      <h2>Lista</h2>

      <div>
        <label>Filtrar por producto (id o nombre)</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej: prod-... o nombre"
        />
      </div>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Material</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {recetasFiltradas.map((r) => {
            const isEditing = editId === r.id;
            const prod = findProducto(r.productoId);
            const mat = findMaterial(r.materialId);

            return (
              <tr key={r.id}>
                <td>
                  {isEditing ? (
                    <select
                      name="productoId"
                      value={editForm.productoId}
                      onChange={onEditChange}
                      required
                    >
                      <option value="">-- seleccionar producto --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div>{prod?.nombre || "(producto no encontrado)"}</div>
                      <small>{r.productoId}</small>
                    </>
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <select
                      name="tipoProduccion"
                      value={editForm.tipoProduccion}
                      onChange={onEditChange}
                      required
                    >
                      <option value="unidad">Por unidad</option>
                      <option value="lote">Por lote/plancha</option>
                    </select>
                  ) : (
                    labelTipo(r.tipoProduccion || "unidad")
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <select
                      name="materialId"
                      value={editForm.materialId}
                      onChange={onEditChange}
                      required
                    >
                      <option value="">-- seleccionar material --</option>
                      {materiales.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div>{mat?.nombre || "(material no encontrado)"}</div>
                      <small>{r.materialId}</small>
                    </>
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input
                      name="cantidad"
                      type="number"
                      value={editForm.cantidad}
                      onChange={onEditChange}
                    />
                  ) : (
                    r.cantidad
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input
                      name="unidad"
                      value={editForm.unidad}
                      onChange={onEditChange}
                    />
                  ) : (
                    r.unidad
                  )}
                </td>

                <td>
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => startEdit(r)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => onDelete(r.id)}>
                        Eliminar
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={saveEdit}>
                        Guardar
                      </button>
                      <button type="button" onClick={cancelEdit}>
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}

          {!loading && recetasFiltradas.length === 0 && (
            <tr>
              <td colSpan="6">No hay recetas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
