import { useEffect, useMemo, useState } from "react";
import {
  getMateriales,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../api";

export default function Materiales() {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Alta
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    stock: 0,
    unidad: "",
  });

  // Filtro
  const [q, setQ] = useState("");

  // Edición
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    categoria: "",
    stock: 0,
    unidad: "",
  });

  async function load() {
    try {
      setError("");
      setLoading(true);
      const data = await getMateriales();
      setMateriales(data);
    } catch (e) {
      setError(e.message || "Error cargando materiales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      await createMaterial(form);
      setForm({ nombre: "", categoria: "", stock: 0, unidad: "" });
      await load();
    } catch (e) {
      setError(e.message || "Error creando material");
    }
  }

  function startEdit(m) {
    setEditId(m.id);
    setEditForm({
      nombre: m.nombre || "",
      categoria: m.categoria || "",
      stock: Number(m.stock || 0),
      unidad: m.unidad || "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ nombre: "", categoria: "", stock: 0, unidad: "" });
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  }

  async function saveEdit() {
    try {
      setError("");
      await updateMaterial(editId, editForm);
      cancelEdit();
      await load();
    } catch (e) {
      setError(e.message || "Error actualizando material");
    }
  }

  async function onDelete(id) {
    const ok = window.confirm("¿Eliminar este material?");
    if (!ok) return;

    try {
      setError("");
      await deleteMaterial(id);
      await load();
    } catch (e) {
      setError(e.message || "Error eliminando material");
    }
  }

  const materialesFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return materiales;
    return materiales.filter((m) =>
      String(m.nombre || "").toLowerCase().includes(term)
    );
  }, [materiales, q]);

  return (
    <div>
      <h1>Materiales</h1>

      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}

      <h2>Alta</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Nombre *</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            placeholder="Ej: vinilo mate"
            required
          />
        </div>

        <div>
          <label>Categoría</label>
          <input
            name="categoria"
            value={form.categoria}
            onChange={onChange}
            placeholder="Ej: vinilos"
          />
        </div>

        <div>
          <label>Stock</label>
          <input
            name="stock"
            type="number"
            value={form.stock}
            onChange={onChange}
          />
        </div>

        <div>
          <label>Unidad</label>
          <input
            name="unidad"
            value={form.unidad}
            onChange={onChange}
            placeholder="Ej: planchas"
          />
        </div>

        <button type="submit">Crear</button>
        <button type="button" onClick={load}>
          Recargar
        </button>
      </form>

      <h2>Lista</h2>

      <div>
        <label>Filtrar por nombre</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="buscar..."
        />
      </div>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Unidad</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {materialesFiltrados.map((m) => {
            const isEditing = editId === m.id;

            return (
              <tr key={m.id}>
                <td>
                  {isEditing ? (
                    <input
                      name="nombre"
                      value={editForm.nombre}
                      onChange={onEditChange}
                      required
                    />
                  ) : (
                    m.nombre
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input
                      name="categoria"
                      value={editForm.categoria}
                      onChange={onEditChange}
                    />
                  ) : (
                    m.categoria
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input
                      name="stock"
                      type="number"
                      value={editForm.stock}
                      onChange={onEditChange}
                    />
                  ) : (
                    m.stock
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
                    m.unidad
                  )}
                </td>

                <td>
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => startEdit(m)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => onDelete(m.id)}>
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

          {!loading && materialesFiltrados.length === 0 && (
            <tr>
              <td colSpan="5">No hay materiales.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
