const API_URL = "http://localhost:3001";

export async function getMateriales() {
  const res = await fetch(`${API_URL}/materiales`);
  if (!res.ok) throw new Error("Error al cargar materiales");
  return res.json();
}

export async function createMaterial(material) {
  const res = await fetch(`${API_URL}/materiales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(material),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Error al crear material");
  return data;
}

export async function updateMaterial(id, updates) {
  const res = await fetch(`${API_URL}/materiales/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Error al actualizar material");
  return data;
}

export async function deleteMaterial(id) {
  const res = await fetch(`${API_URL}/materiales/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Error al eliminar material");
  return data;
}
