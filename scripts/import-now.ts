#!/usr/bin/env tsx
import { importFromGoogleSheet } from '../server/import-sheets';

const SPREADSHEET_ID = '1qERK5_E7oilEICCxW3IADUP1MXjb79JsxPG4-FQsrh0';
const SHEET_NAME = 'index';

console.log('🚀 Iniciando importación desde Google Sheets...');
console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`);
console.log(`📄 Hoja: "${SHEET_NAME}"\n`);

importFromGoogleSheet(SPREADSHEET_ID, SHEET_NAME)
  .then((result) => {
    console.log('\n📊 RESULTADO:', JSON.stringify(result, null, 2));
    if (result.success) {
      console.log('\n✅ ¡ÉXITO! Se importaron', result.imported, 'diagramas');
      process.exit(0);
    } else {
      console.log('\n❌ Error:', result.message);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error);
    process.exit(1);
  });
