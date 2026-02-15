/**
 * Main seed script - Ejecuta todos los seeds en orden
 */

console.log("🌱 Running all seeds...\n");

// Importar y ejecutar el seed de routing
console.log("📍 Seeding routing aliases...");
await import("./seed-routing.ts");

// Importar y ejecutar el seed de domains
console.log("\n🌐 Seeding domains...");
await import("./seed-domains.ts");

console.log("\n✅ All seeds completed successfully!");
