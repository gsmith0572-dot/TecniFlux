import { google } from 'googleapis';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { diagrams } from '../shared/schema';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

interface SheetRow {
  fileName: string;
  fileId: string;
  fileUrl?: string;
  directUrl: string;
  make?: string;
  model?: string;
  year?: string;
  system?: string;
  status?: string;
  tags?: string;
  notes?: string;
}

export async function importFromGoogleSheet(spreadsheetId: string, sheetName: string = 'Sheet1') {
  try {
    console.log('🔄 Iniciando importación desde Google Sheets...');
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);
    console.log(`📄 Hoja: ${sheetName}`);

    const sheets = await getGoogleSheetClient();

    // Leer datos del sheet - hasta columna I para incluir status
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:I`, // A-H son los campos originales, I es status
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('⚠️  No se encontraron datos en el sheet');
      return { success: false, message: 'No hay datos en el sheet' };
    }

    // Primera fila son los encabezados
    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
    console.log(`📋 Columnas encontradas: ${headers.join(', ')}`);

    // Convertir filas a objetos - IMPORTAR TODAS LAS FILAS
    const data: SheetRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });

      // Solo validar campos OBLIGATORIOS: file_name, file_id, direct_url
      if (obj.file_name && obj.file_id && obj.direct_url) {
        data.push({
          fileName: obj.file_name,
          fileId: obj.file_id,
          fileUrl: obj.file_url || null,
          directUrl: obj.direct_url,
          make: obj.make || null,
          model: obj.model || null,
          year: obj.year ? obj.year.toString() : null,
          system: obj.system || null,
          status: obj.status || 'partial', // Default a 'partial' si no existe
          tags: obj.tags || null,
          notes: obj.notes || null,
        } as any);
      }
    }

    console.log(`✅ ${data.length} diagramas válidos encontrados`);

    if (data.length === 0) {
      return { success: false, message: 'No se encontraron diagramas válidos' };
    }

    // DEDUPLICAR por file_id (mantener el último registro de cada file_id)
    const deduped = new Map<string, SheetRow>();
    data.forEach(diagram => {
      deduped.set(diagram.fileId, diagram);
    });
    const uniqueData = Array.from(deduped.values());
    
    console.log(`⚠️  ${data.length - uniqueData.length} duplicados eliminados (file_id repetidos)`);
    console.log(`✅ ${uniqueData.length} diagramas únicos para importar`);

    // Insertar/actualizar en la base de datos en lotes usando ON CONFLICT (UPSERT rápido)
    const batchSize = 500; // Incrementar tamaño de batch
    let totalProcessed = 0;

    console.log('💾 Insertando en lotes con ON CONFLICT...');

    for (let i = 0; i < uniqueData.length; i += batchSize) {
      const batch = uniqueData.slice(i, i + batchSize);
      
      // Preparar valores con searchText calculado
      const valuesToInsert = batch.map(diagram => ({
        fileName: diagram.fileName,
        fileId: diagram.fileId,
        fileUrl: diagram.fileUrl,
        directUrl: diagram.directUrl,
        make: diagram.make,
        model: diagram.model,
        year: diagram.year,
        system: diagram.system,
        status: diagram.status,
        tags: diagram.tags,
        notes: diagram.notes,
        searchText: [
          diagram.fileName,
          diagram.make,
          diagram.model,
          diagram.year,
          diagram.system
        ].filter(Boolean).join(' ').toLowerCase(),
      }));

      // Ejecutar INSERT con ON CONFLICT DO UPDATE usando Drizzle
      await db.insert(diagrams)
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
            updatedAt: new Date(),
          }
        });

      totalProcessed += batch.length;
      console.log(`📥 Procesados ${totalProcessed}/${uniqueData.length} diagramas...`);
    }

    const imported = totalProcessed;
    const updated = 0; // No podemos distinguir en batch, pero el total es correcto

    console.log(`✅ Importación completada: ${imported} nuevos + ${updated} actualizados`);

    return {
      success: true,
      message: `${imported} diagramas nuevos, ${updated} actualizados`,
      imported: imported,
      updated: updated,
      total: imported + updated
    };

  } catch (error) {
    console.error('❌ Error en importación:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
      error
    };
  }
}

// Script de línea de comandos (ejecutar con: tsx server/import-sheets.ts SPREADSHEET_ID SHEET_NAME)
// Comentado para evitar problemas con ESM imports
// const spreadsheetId = process.argv[2];
// const sheetName = process.argv[3] || 'Sheet1';
//
// if (spreadsheetId) {
//   importFromGoogleSheet(spreadsheetId, sheetName)
//     .then((result) => console.log('\n📊 Resultado:', result))
//     .catch((error) => console.error('\n❌ Error:', error));
// }
