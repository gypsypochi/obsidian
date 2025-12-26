const express = require("express");
const router = express.Router();
const { readRecetas, writeRecetas } = require("../utils/fileDB");

// GET /recetas
router.get("/", (req, res) => {
  const recetas = readRecetas();
  res.json(recetas);
});

// POST /recetas
router.post("/", (req, res) => {
  const { productoId, materialId, cantidad, unidad, tipoProduccion } = req.body;

  if (!productoId || String(productoId).trim() === "") {
    return res.status(400).json({ error: "productoId es obligatorio" });
  }

  if (!materialId || String(materialId).trim() === "") {
    return res.status(400).json({ error: "materialId es obligatorio" });
  }

  if (cantidad !== undefined && typeof cantidad !== "number") {
    return res.status(400).json({ error: "Cantidad debe ser numérica" });
  }

  let tipo = tipoProduccion ? String(tipoProduccion).trim() : "unidad";
  if (tipo !== "unidad" && tipo !== "lote") {
    return res
      .status(400)
      .json({ error: "tipoProduccion debe ser 'unidad' o 'lote'" });
  }

  const recetas = readRecetas();

  const nuevaReceta = {
    id: `rec-${Date.now()}`,
    productoId: String(productoId).trim(),
    materialId: String(materialId).trim(),
    cantidad: cantidad ?? 0,
    unidad: unidad ? String(unidad).trim() : "",
    tipoProduccion: tipo, // NUEVO
  };

  recetas.push(nuevaReceta);
  writeRecetas(recetas);

  res.status(201).json(nuevaReceta);
});

// PUT /recetas/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { productoId, materialId, cantidad, unidad, tipoProduccion } = req.body;

  const recetas = readRecetas();
  const index = recetas.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Receta no encontrada" });
  }

  if (productoId !== undefined && String(productoId).trim() === "") {
    return res
      .status(400)
      .json({ error: "productoId no puede ser vacío" });
  }

  if (materialId !== undefined && String(materialId).trim() === "") {
    return res
      .status(400)
      .json({ error: "materialId no puede ser vacío" });
  }

  if (cantidad !== undefined && typeof cantidad !== "number") {
    return res.status(400).json({ error: "Cantidad debe ser numérica" });
  }

  let tipoActual = recetas[index].tipoProduccion || "unidad";
  let tipo = tipoProduccion !== undefined
    ? String(tipoProduccion).trim()
    : tipoActual;

  if (tipo !== "unidad" && tipo !== "lote") {
    return res
      .status(400)
      .json({ error: "tipoProduccion debe ser 'unidad' o 'lote'" });
  }

  const actual = recetas[index];

  const actualizada = {
    ...actual,
    productoId:
      productoId !== undefined
        ? String(productoId).trim()
        : actual.productoId,
    materialId:
      materialId !== undefined
        ? String(materialId).trim()
        : actual.materialId,
    cantidad: cantidad !== undefined ? cantidad : actual.cantidad,
    unidad:
      unidad !== undefined ? String(unidad).trim() : actual.unidad,
    tipoProduccion: tipo,
  };

  recetas[index] = actualizada;
  writeRecetas(recetas);

  res.json(actualizada);
});

// DELETE /recetas/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const recetas = readRecetas();
  const index = recetas.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Receta no encontrada" });
  }

  const eliminado = recetas.splice(index, 1)[0];
  writeRecetas(recetas);

  res.json({ ok: true, eliminado });
});

module.exports = router;
