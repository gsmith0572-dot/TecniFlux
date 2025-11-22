// server/gemini.ts
// Versión STUB (sin llamadas a la API)

export async function searchVehicleResources(
  make: string,
  model: string,
  year: string,
  system?: string,
  keyword?: string
) {
  console.log("[Gemini STUB] searchVehicleResources()", {
    make,
    model,
    year,
    system,
    keyword,
  });

  return {
    results: [],
    source: "local-stub",
  };
}

export async function searchByVIN(vin: string) {
  console.log("[Gemini STUB] searchByVIN()", { vin });

  return {
    results: [],
    source: "local-stub",
  };
}
