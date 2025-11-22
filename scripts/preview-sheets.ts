import { google } from 'googleapis';

const SPREADSHEET_ID = '1ZdRSgJs8XiC3LpIan-anzNt7xpm0DTEPG0tpYsO6WTQ';
const SHEET_NAME = 'Index';

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectionSettings = await fetch(
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

async function previewSheet() {
  console.log('📊 Leyendo datos de la hoja "Index"...\n');
  
  const accessToken = await getAccessToken();
  
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:K`,
  });
  
  const rows = response.data.values;
  
  if (!rows || rows.length === 0) {
    console.log('⚠️  La hoja está vacía');
    return;
  }
  
  console.log(`📋 Encabezados (fila 1):`);
  console.log(rows[0].map((h, i) => `  ${i + 1}. ${h}`).join('\n'));
  
  console.log(`\n📊 Total de filas: ${rows.length}`);
  console.log(`📊 Filas con datos: ${rows.length - 1}\n`);
  
  if (rows.length > 1) {
    console.log('🔍 Primeras 5 filas de datos:\n');
    for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
      const row = rows[i];
      console.log(`Fila ${i}:`);
      rows[0].forEach((header, j) => {
        const value = row[j] || '(vacío)';
        console.log(`  ${header}: ${value}`);
      });
      console.log('');
    }
  }
  
  // Validar campos requeridos
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  let validCount = 0;
  const missingFields: any = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    
    const required = ['file_name', 'direct_url', 'make', 'model', 'year', 'system'];
    const missing = required.filter(field => !obj[field]);
    
    if (missing.length === 0) {
      validCount++;
    } else {
      missing.forEach(field => {
        missingFields[field] = (missingFields[field] || 0) + 1;
      });
    }
  }
  
  console.log('📊 Resumen de Validación:');
  console.log(`✅ Diagramas válidos: ${validCount}`);
  console.log(`❌ Diagramas con campos faltantes: ${rows.length - 1 - validCount}\n`);
  
  if (Object.keys(missingFields).length > 0) {
    console.log('⚠️  Campos faltantes más comunes:');
    Object.entries(missingFields).forEach(([field, count]) => {
      console.log(`  - ${field}: ${count} filas`);
    });
  }
}

previewSheet().catch(console.error);
