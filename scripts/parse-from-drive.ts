import { google } from 'googleapis';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const credentials = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'google-credentials.json'), 'utf8')
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });
const folderPaths = new Map<string, string>();

interface ParsedInfo {
  make: string | null;
  model: string | null;
  year: string | null;
}

const MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chevy',
  'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'GMC', 'Honda', 'Hyundai',
  'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
  'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'Mercedes-Benz', 'Mercedes', 'Benz',
  'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram', 'Renault',
  'Rolls-Royce', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'VW', 'Volvo'
];

async function getFilePath(fileId: string): Promise<string> {
  const parts: string[] = [];
  let currentId = fileId;

  try {
    while (currentId) {
      if (folderPaths.has(currentId)) {
        parts.unshift(folderPaths.get(currentId)!);
        break;
      }

      const response = await drive.files.get({
        fileId: currentId,
        fields: 'name, parents',
      });

      const name = response.data.name || '';
      parts.unshift(name);
      folderPaths.set(currentId, name);

      const parents = response.data.parents;
      if (!parents || parents.length === 0) break;
      currentId = parents[0];
    }

    return parts.join('/');
  } catch (error) {
    console.error(`Error obteniendo ruta para ${fileId}:`, error);
    return '';
  }
}

function extractMakeFromPath(path: string): string | null {
  const pathLower = path.toLowerCase();
  for (const make of MAKES) {
    if (pathLower.includes(make.toLowerCase())) {
      return make;
    }
  }
  return null;
}

function extractYearFromPath(path: string): string | null {
  const rangeMatch = path.match(/(\d{4})[-_](\d{4})/);
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`;
  }
  const singleMatch = path.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (singleMatch) {
    return singleMatch[1];
  }
  return null;
}

function extractModelFromPath(path: string, make: string | null): string | null {
  if (!make) return null;
  const parts = path.split('/');
  const makeIndex = parts.findIndex(p => p.toLowerCase().includes(make.toLowerCase()));
  if (makeIndex === -1 || makeIndex >= parts.length - 1) return null;
  const modelCandidate = parts[makeIndex + 1];
  return modelCandidate
    .replace(/\d{4}[-_]\d{4}/g, '')
    .replace(/\b(19\d{2}|20[0-2]\d)\b/g, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

function parseFromPath(path: string): ParsedInfo {
  const make = extractMakeFromPath(path);
  const year = extractYearFromPath(path);
  const model = extractModelFromPath(path, make);
  return { make, model, year };
}

async function main() {
  console.log('🚀 PARSER CON GOOGLE DRIVE API - Iniciando...\n');
  
  const result = await pool.query(
    'SELECT id, file_name, file_id FROM diagrams WHERE make IS NULL LIMIT 15000'
  );
  
  console.log(`📊 Procesando ${result.rows.length} diagramas sin marca...\n`);
  
  let updated = 0;
  let errors = 0;
  
  for (const diagram of result.rows) {
    try {
      console.log(`\nProcesando: ${diagram.file_name}`);
      
      const fullPath = await getFilePath(diagram.file_id);
      console.log(`  Ruta: ${fullPath}`);
      
      const info = parseFromPath(fullPath);
      console.log(`  Make: ${info.make}, Model: ${info.model}, Year: ${info.year}`);
      
      if (info.make || info.model || info.year) {
        await pool.query(
          'UPDATE diagrams SET make = $1, model = $2, year = $3 WHERE id = $4',
          [info.make, info.model, info.year, diagram.id]
        );
        updated++;
        console.log(`  ✅ Actualizado`);
      } else {
        console.log(`  ⚠️  No se pudo extraer información`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS:');
  console.log('='.repeat(60));
  console.log(`Total procesados:  ${result.rows.length}`);
  console.log(`Actualizados:      ${updated}`);
  console.log(`Errores:           ${errors}`);
  console.log('='.repeat(60));
  
  await pool.end();
  process.exit(0);
}

main().catch(console.error);
