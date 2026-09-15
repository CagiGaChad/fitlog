// Open Food Facts: API pública y gratuita, sin necesidad de clave.
// Documentación: https://wiki.openfoodfacts.org/API

export async function searchOpenFoodFacts(query) {
  if (!query || query.trim().length < 2) return [];

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?" +
    new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "20",
      fields: "product_name,brands,nutriments",
    });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Respuesta no válida de Open Food Facts");
    const data = await res.json();
    const products = data.products || [];

    return products
      .filter((p) => p.product_name && p.nutriments && p.nutriments["energy-kcal_100g"] != null)
      .map((p, i) => ({
        id: `off_${i}_${Date.now()}`,
        source: "off",
        name: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
        kcal100: round1(p.nutriments["energy-kcal_100g"]),
        protein100: round1(p.nutriments["proteins_100g"] || 0),
        carbs100: round1(p.nutriments["carbohydrates_100g"] || 0),
        fat100: round1(p.nutriments["fat_100g"] || 0),
      }))
      .slice(0, 20);
  } catch (e) {
    console.error("Error buscando en Open Food Facts", e);
    return null; // null = fallo de red, distinto de "sin resultados"
  }
}

// Busca un producto por su código de barras (EAN/UPC) escaneado con la cámara.
export async function getProductByBarcode(barcode) {
  if (!barcode) return null;

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Respuesta no válida de Open Food Facts");
    const data = await res.json();
    if (data.status !== 1 || !data.product) return undefined; // undefined = no existe ese código

    const p = data.product;
    const n = p.nutriments || {};
    if (!p.product_name || n["energy-kcal_100g"] == null) return undefined;

    return {
      id: `off_${barcode}`,
      source: "off",
      barcode,
      name: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
      kcal100: round1(n["energy-kcal_100g"]),
      protein100: round1(n["proteins_100g"] || 0),
      carbs100: round1(n["carbohydrates_100g"] || 0),
      fat100: round1(n["fat_100g"] || 0),
    };
  } catch (e) {
    console.error("Error buscando código de barras en Open Food Facts", e);
    return null; // null = fallo de red, distinto de "no existe"
  }
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
