import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { diagrams } from './shared/schema';
import { eq, or, isNull } from 'drizzle-orm';

// Lista de marcas comunes (case-insensitive)
const BRAND_PATTERN = /(Toyota|Honda|Ford|Nissan|Chevrolet|GM|Dodge|Chrysler|Jeep|Ram|Subaru|Mazda|Mitsubishi|Hyundai|Kia|Volkswagen|VW|Audi|BMW|Mercedes|Mercedes-Benz|Lexus|Acura|Infiniti|Buick|Cadillac|GMC|Lincoln|Volvo|Porsche|Jaguar|Land Rover|Range Rover|Mini|Fiat|Alfa Romeo|Genesis|Tesla)/i;

// Patrón para años (1990-2025)
const YEAR_PATTERN = /\b(19[89]\d|20[0-2]\d)\b/;

// Caracteres especiales a limpiar
const SPECIAL_CHARS = /[•\-_]/g;

interface ParsedData {
  make: string | null;
  model: string | null;
  year: string | null;
}

/**
 * Limpia el fileName removiendo caracteres especiales y normalizando espacios
 */
function cleanFileName(fileName: string): string {
  return fileName
    .replace(SPECIAL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae la marca del texto
 */
function extractMake(text: string): string | null {
  const match = text.match(BRAND_PATTERN);
  if (match) {
    // Normalizar marca (ej: Mercedes-Benz -> Mercedes, VW -> Volkswagen)
    const brand = match[1];
    const normalized = brand
      .replace(/-/g, '')
      .replace(/^VW$/i, 'Volkswagen')
      .replace(/^GM$/i, 'General Motors');
    
    // Capitalizar primera letra
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }
  return null;
}

/**
 * Extrae el año del texto
 */
function extractYear(text: string): string | null {
  const match = text.match(YEAR_PATTERN);
  if (match) {
    const year = parseInt(match[1]);
    // Validar rango razonable (1990-2025)
    if (year >= 1990 && year <= 2025) {
      return year.toString();
    }
  }
  return null;
}

/**
 * Extrae el modelo del texto
 * Estrategia: texto antes de la marca + texto después de la marca (hasta el año)
 */
function extractModel(text: string, make: string | null, year: string | null): string | null {
  if (!make) return null;

  const textLower = text.toLowerCase();
  const makeLower = make.toLowerCase();
  const makeIndex = textLower.indexOf(makeLower);
  
  if (makeIndex === -1) return null;

  // Parte antes de la marca
  const beforeMake = text.substring(0, makeIndex).trim();
  
  // Parte después de la marca (hasta el año si existe)
  let afterMake = '';
  const afterMakeStart = makeIndex + make.length;
  if (year) {
    const yearIndex = text.indexOf(year, afterMakeStart);
    if (yearIndex !== -1) {
      afterMake = text.substring(afterMakeStart, yearIndex).trim();
    } else {
      afterMake = text.substring(afterMakeStart).trim();
    }
  } else {
    afterMake = text.substring(afterMakeStart).trim();
  }

  // Combinar partes del modelo
  const modelParts = [beforeMake, afterMake].filter(Boolean);
  if (modelParts.length === 0) return null;

  const model = modelParts.join(' ');

  // Limpiar y normalizar
  return model
    .replace(SPECIAL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

/**
 * Parsea el fileName y extrae make, model, year
 */
function parseFileName(fileName: string): ParsedData {
  const cleaned = cleanFileName(fileName);
  
  const make = extractMake(cleaned);
  const year = extractYear(cleaned);
  const model = extractModel(cleaned, make, year);

  return { make, model, year };
}

/**
 * Procesa y actualiza diagramas en la base de datos
 */
async function parseAndUpdateDiagrams() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }

    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema: { diagrams } });

    console.log('🔍 Buscando diagramas con make=NULL o year=NULL...\n');

    // Obtener diagramas que necesitan actualización
    const diagramsToUpdate = await db
      .select({
        id: diagrams.id,
        fileName: diagrams.fileName,
        make: diagrams.make,
        year: diagrams.year,
        model: diagrams.model,
      })
      .from(diagrams)
      .where(or(isNull(diagrams.make), isNull(diagrams.year)));

    console.log(`📊 Encontrados ${diagramsToUpdate.length} diagramas para procesar\n`);

    if (diagramsToUpdate.length === 0) {
      console.log('✅ No hay diagramas que actualizar');
      await pool.end();
      process.exit(0);
    }

    // Procesar y actualizar en lotes
    const BATCH_SIZE = 500;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const startTime = Date.now();

    console.log(`💾 Procesando en lotes de ${BATCH_SIZE}...\n`);

    for (let i = 0; i < diagramsToUpdate.length; i += BATCH_SIZE) {
      const batch = diagramsToUpdate.slice(i, i + BATCH_SIZE);
      const updates: Array<{ id: string; make: string | null; model: string | null; year: string | null }> = [];

      // Parsear cada diagrama del lote
      for (const diagram of batch) {
        const parsed = parseFileName(diagram.fileName);

        // Solo actualizar si encontramos al menos make o year
        if (parsed.make || parsed.year) {
          updates.push({
            id: diagram.id,
            make: parsed.make || diagram.make || null,
            model: parsed.model || diagram.model || null,
            year: parsed.year || diagram.year || null,
          });
        } else {
          totalSkipped++;
        }
      }

      // Actualizar en la base de datos
      if (updates.length > 0) {
        for (const update of updates) {
          await db
            .update(diagrams)
            .set({
              make: update.make,
              model: update.model,
              year: update.year,
              updatedAt: new Date(),
            })
            .where(eq(diagrams.id, update.id));
        }
        totalUpdated += updates.length;
      }

      totalProcessed += batch.length;
      const progress = ((totalProcessed / diagramsToUpdate.length) * 100).toFixed(1);
      console.log(
        `📥 Procesados ${totalProcessed}/${diagramsToUpdate.length} (${progress}%) | Actualizados: ${totalUpdated} | Omitidos: ${totalSkipped}`
      );
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    console.log(`📊 Total procesados: ${totalProcessed} diagramas`);
    console.log(`✅ Total actualizados: ${totalUpdated} diagramas`);
    console.log(`⚠️  Total omitidos: ${totalSkipped} diagramas (no se encontró make ni year)`);
    console.log(`⏱️  Tiempo total: ${duration}s`);
    console.log(`⚡ Velocidad: ${(totalProcessed / parseFloat(duration)).toFixed(0)} diagramas/segundo`);
    console.log('='.repeat(60) + '\n');

    // Mostrar estadísticas finales
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(make) as with_make,
        COUNT(year) as with_year,
        COUNT(model) as with_model
      FROM diagrams
    `);

    const stats = finalStats.rows[0];
    console.log('📈 ESTADÍSTICAS FINALES:');
    console.log(`   Total diagramas: ${stats.total}`);
    console.log(`   Con 'make': ${stats.with_make} (${((stats.with_make / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   Con 'year': ${stats.with_year} (${((stats.with_year / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   Con 'model': ${stats.with_model} (${((stats.with_model / stats.total) * 100).toFixed(1)}%)\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar
parseAndUpdateDiagrams();

