import { google } from 'googleapis';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { diagrams } from '../shared/schema';

async function getGoogleSheetClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not found in environment');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:I`,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('⚠️  No se encontraron datos en el sheet');
      return { success: false, message: 'No hay datos en el sheet' };
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
    console.log(`📋 Columnas encontradas: ${headers.join(', ')}`);

    const data: SheetRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });

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
          status: obj.status || 'partial',
          tags: obj.tags || null,
          notes: obj.notes || null,
        } as any);
      }
    }

    console.log(`✅ ${data.length} diagramas válidos encontrados`);

    if (data.length === 0) {
      return { success: false, message: 'No se encontraron diagramas válidos' };
    }

    const deduped = new Map<string, SheetRow>();
    data.forEach(diagram => {
      deduped.set(diagram.fileId, diagram);
    });
    const uniqueData = Array.from(deduped.values());
    
    console.log(`⚠️  ${data.length - uniqueData.length} duplicados eliminados`);
    console.log(`✅ ${uniqueData.length} diagramas únicos para importar`);

    const batchSize = 500;
    let totalProcessed = 0;

    console.log('💾 Insertando en lotes...');

    for (let i = 0; i < uniqueData.length; i += batchSize) {
      const batch = uniqueData.slice(i, i + batchSize);
      
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

    console.log(`✅ Importación completada: ${totalProcessed} diagramas`);

    return {
      success: true,
      message: `${totalProcessed} diagramas importados/actualizados`,
      imported: totalProcessed,
      updated: 0,
      total: totalProcessed
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
