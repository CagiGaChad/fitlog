// Open Food Facts: API pública y gratuita, sin necesidad de clave.
// Documentación: https://wiki.openfoodfacts.org/API
import type { Food } from "./types";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

interface OffProduct {
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

export async function searchOpenFoodFacts(query: string): Promise<Food[] | null> {
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
      .filter((p: OffProduct) => p.product_name && p.nutriments && p.nutriments["energy-kcal_100g"] != null)
      .map((p: OffProduct, i: number): Food => {
        const n = p.nutriments!;
        return {
          id: `off_${i}_${Date.now()}`,
          source: "off",
          name: p.brands ? `${p.product_name} (${p.brands})` : p.product_name!,
          kcal100: round1(n["energy-kcal_100g"]!),
          protein100: round1(n.proteins_100g || 0),
          carbs100: round1(n.carbohydrates_100g || 0),
          fat100: round1(n.fat_100g || 0),
        };
      })
      .slice(0, 20);
  } catch (e) {
    console.error("Error buscando en Open Food Facts", e);
    return null; // null = fallo de red, distinto de "sin resultados"
  }
}

// Busca un producto por su código de barras (EAN/UPC) escaneado con la cámara.
// undefined = no existe ese código, null = fallo de red.
export async function getProductByBarcode(barcode: string): Promise<Food | null | undefined> {
  if (!barcode) return undefined;

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Respuesta no válida de Open Food Facts");
    const data = await res.json();
    if (data.status !== 1 || !data.product) return undefined;

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
    return null;
  }
}
