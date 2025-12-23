const express = require("express");
const router = express.Router();
const { readMaterials, writeMaterials } = require("../utils/fileDB");

// GET /materiales
router.get("/", (req, res) => {
  const materiales = readMaterials();
  res.json(materiales);
});

// POST /materiales
router.post("/", (req, res) => {
  const { nombre, categoria, stock, unidad } = req.body;

  if (!nombre || nombre.trim() === "") {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  if (stock !== undefined && typeof stock !== "number") {
    return res.status(400).json({ error: "Stock debe ser numérico" });
  }

  const materiales = readMaterials();

  const nuevoMaterial = {
    id: `mat-${Date.now()}`,
    nombre: nombre.trim(),
    categoria: categoria ? String(categoria).trim() : "",
    stock: stock ?? 0,
    unidad: unidad ? String(unidad).trim() : ""
  };

  materiales.push(nuevoMaterial);
  writeMaterials(materiales);

  res.status(201).json(nuevoMaterial);
});

// PUT /materiales/:id  (editar)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, stock, unidad } = req.body;

  const materiales = readMaterials();
  const index = materiales.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Material no encontrado" });
  }

  // Validaciones mínimas (si viene nombre, no puede venir vacío)
  if (nombre !== undefined && String(nombre).trim() === "") {
    return res.status(400).json({ error: "El nombre no puede ser vacío" });
  }

  if (stock !== undefined && typeof stock !== "number") {
    return res.status(400).json({ error: "Stock debe ser numérico" });
  }

  const materialActual = materiales[index];

  const materialActualizado = {
    ...materialActual,
    nombre: nombre !== undefined ? String(nombre).trim() : materialActual.nombre,
    categoria:
      categoria !== undefined ? String(categoria).trim() : materialActual.categoria,
    stock: stock !== undefined ? stock : materialActual.stock,
    unidad: unidad !== undefined ? String(unidad).trim() : materialActual.unidad
  };

  materiales[index] = materialActualizado;
  writeMaterials(materiales);

  res.json(materialActualizado);
});

// DELETE /materiales/:id (eliminar)
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const materiales = readMaterials();
  const index = materiales.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Material no encontrado" });
  }

  const eliminado = materiales.splice(index, 1)[0];
  writeMaterials(materiales);

  res.json({ ok: true, eliminado });
});

module.exports = router;
