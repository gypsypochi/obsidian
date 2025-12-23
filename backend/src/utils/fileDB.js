const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../../data/materiales.json");

function readMaterials() {
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
}

function writeMaterials(materials) {
  fs.writeFileSync(dataPath, JSON.stringify(materials, null, 2));
}

module.exports = { readMaterials, writeMaterials };
