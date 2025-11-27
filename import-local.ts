import 'dotenv/config';
import { google } from 'googleapis';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './server/db';
import { diagrams } from './shared/schema';

const SPREADSHEET_ID = '1ZdRSgJs8XiC3LpIan-anzNt7xpm0DTEPG0tpYsO6WTQ';
const SHEET_NAME = 'Index';
const CREDENTIALS_PATH = './tecniflux-87477befaaa8.json';
const BATCH_SIZE = 500;

interface SheetRow {
  file_name: string;
  file_id: string;
  file_url?: string;
  direct_url: string;
  make?: string;
  model?: string;
  year?: string;
  system?: string;
  status?: string;
  tags?: string;
  notes?: string;
}

/**
 * Obtiene un cliente de Google Sheets autenticado usando service account
 * desde el archivo JSON de credenciales
 */
function getGoogleSheetClient() {
  try {
    const credentialsPath = join(process.cwd(), CREDENTIALS_PATH);
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    throw new Error(
      `Error al leer credenciales desde ${CREDENTIALS_PATH}: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
}

/**
 * Calcula el searchText concatenando fileName + make + model + year + system
 */
function calculateSearchText(
  fileName: string,
  make?: string,
  model?: string,
  year?: string,
  system?: string
): string {
  const parts = [fileName, make, model, year, system].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

/**
 * Valida que los campos requeridos no estén vacíos
 */
function isValidRow(row: SheetRow): boolean {
  return !!(
    row.file_name &&
    row.file_name.trim() &&
    row.file_id &&
    row.file_id.trim() &&
    row.direct_url &&
    row.direct_url.trim()
  );
}

/**
 * Importa diagramas desde Google Sheets a PostgreSQL
 */
async function importDiagrams() {
  try {
    console.log('🚀 Iniciando importación de diagramas desde Google Sheets...\n');
    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`);
    console.log(`📄 Hoja: ${SHEET_NAME}`);
    console.log(`📁 Credenciales: ${CREDENTIALS_PATH}\n`);

    // 1. Obtener cliente de Google Sheets
    console.log('🔐 Autenticando con Google Sheets...');
    const sheets = getGoogleSheetClient();
    console.log('✅ Autenticación exitosa\n');

    // 2. Leer datos del sheet
    console.log('📥 Leyendo datos del Google Sheet...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:K`, // A-K para cubrir todas las columnas necesarias
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      throw new Error('No se encontraron datos en el sheet');
    }

    // 3. Procesar headers
    const headers = rows[0].map((h: string) =>
      h.toLowerCase().replace(/\s+/g, '_')
    );
    console.log(`📋 Columnas encontradas: ${headers.join(', ')}\n`);

    // 4. Parsear filas y validar
    console.log('🔍 Procesando y validando filas...');
    const validRows: SheetRow[] = [];
    let skippedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || '';
      });

      const sheetRow: SheetRow = {
        file_name: obj.file_name || '',
        file_id: obj.file_id || '',
        file_url: obj.file_url || undefined,
        direct_url: obj.direct_url || '',
        make: obj.make || undefined,
        model: obj.model || undefined,
        year: obj.year ? String(obj.year) : undefined,
        system: obj.system || undefined,
        status: obj.status || 'partial',
        tags: obj.tags || undefined,
        notes: obj.notes || undefined,
      };

      if (isValidRow(sheetRow)) {
        validRows.push(sheetRow);
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ ${validRows.length} diagramas válidos encontrados`);
    if (skippedCount > 0) {
      console.log(`⚠️  ${skippedCount} filas omitidas (campos requeridos vacíos)\n`);
    } else {
      console.log('');
    }

    if (validRows.length === 0) {
      throw new Error('No se encontraron diagramas válidos para importar');
    }

    // 5. Eliminar duplicados por file_id
    const uniqueMap = new Map<string, SheetRow>();
    validRows.forEach((row) => {
      uniqueMap.set(row.file_id, row);
    });
    const uniqueRows = Array.from(uniqueMap.values());

    if (validRows.length !== uniqueRows.length) {
      console.log(
        `⚠️  ${validRows.length - uniqueRows.length} duplicados eliminados`
      );
      console.log(`✅ ${uniqueRows.length} diagramas únicos para importar\n`);
    }

    // 6. Importar en lotes de 500
    console.log(`💾 Importando en lotes de ${BATCH_SIZE}...\n`);
    let totalProcessed = 0;
    const startTime = Date.now();

    for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
      const batch = uniqueRows.slice(i, i + BATCH_SIZE);

      const valuesToInsert = batch.map((row) => ({
        fileName: row.file_name.trim(),
        fileId: row.file_id.trim(),
        fileUrl: row.file_url?.trim() || null,
        directUrl: row.direct_url.trim(),
        make: row.make?.trim() || null,
        model: row.model?.trim() || null,
        year: row.year?.trim() || null,
        system: row.system?.trim() || null,
        status: row.status || 'partial',
        tags: row.tags?.trim() || null,
        notes: row.notes?.trim() || null,
        searchText: calculateSearchText(
          row.file_name,
          row.make,
          row.model,
          row.year,
          row.system
        ),
      }));

      await db
        .insert(diagrams)
        .values(valuesToInsert)
        .onConflictDoUpdate({
          target: diagrams.fileId,
          set: {
            fileName: sql`EXCLUDED.file_name`,
            fileUrl: sql`EXCLUDED.file_url`,
            directUrl: sql`EXCLUDED.direct_url`,
            make: sql`EXCLUDED.make`,
            model: sql`EXCLUDED.model`,
            year: sql`EXCLUDED.year`,
            system: sql`EXCLUDED.system`,
            status: sql`EXCLUDED.status`,
            tags: sql`EXCLUDED.tags`,
            notes: sql`EXCLUDED.notes`,
            searchText: sql`EXCLUDED.search_text`,
            updatedAt: sql`NOW()`,
          },
        });

      totalProcessed += batch.length;
      const progress = ((totalProcessed / uniqueRows.length) * 100).toFixed(1);
      console.log(
        `📥 Procesados ${totalProcessed}/${uniqueRows.length} diagramas (${progress}%)...`
      );
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('✅ IMPORTACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`📊 Total procesados: ${totalProcessed} diagramas`);
    console.log(`⏱️  Tiempo total: ${duration}s`);
    console.log(`⚡ Velocidad: ${(totalProcessed / parseFloat(duration)).toFixed(0)} diagramas/segundo`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN LA IMPORTACIÓN:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\n');
    process.exit(1);
  }
}

// Ejecutar importación
importDiagrams();
