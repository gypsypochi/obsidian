// backend/src/routes/historial.js
const express = require("express");
const router = express.Router();

const {
  readHistorialStock,
} = require("../utils/fileDB");

// GET /historial - lista completa de movimientos de stock
// (a futuro se puede filtrar por producto, fecha, etc.)
router.get("/", (req, res) => {
  try {
    const historial = readHistorialStock();
    res.json(historial);
  } catch (err) {
    console.error("Error leyendo historial de stock:", err);
    res.status(500).json({ error: "Error leyendo historial de stock" });
  }
});

module.exports = router;
