import { google } from 'googleapis';

const SPREADSHEET_ID = '1ZdRSgJs8XiC3LpIan-anzNt7xpm0DTEPG0tpYsO6WTQ';

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

async function listSheets() {
  console.log('📊 Obteniendo información del Google Sheet...\n');
  
  const accessToken = await getAccessToken();
  
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  console.log('📋 Hojas encontradas:');
  console.log('==================\n');
  
  if (response.data.sheets) {
    response.data.sheets.forEach((sheet, index) => {
      console.log(`${index + 1}. "${sheet.properties?.title}"`);
      console.log(`   - ID: ${sheet.properties?.sheetId}`);
      console.log(`   - Filas: ${sheet.properties?.gridProperties?.rowCount}`);
      console.log(`   - Columnas: ${sheet.properties?.gridProperties?.columnCount}\n`);
    });
  }
  
  console.log('==================');
  console.log('✅ Usa uno de estos nombres exactos en el script de importación');
}

listSheets().catch(console.error);
