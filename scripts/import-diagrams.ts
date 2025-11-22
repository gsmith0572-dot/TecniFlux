import { importFromGoogleSheet } from '../server/import-sheets';

const SPREADSHEET_ID = '1ZdRSgJs8XiC3LpIan-anzNt7xpm0DTEPG0tpYsO6WTQ';

// Nombre exacto de la hoja encontrada
const possibleSheetNames = ['Index'];

async function tryImport() {
  console.log('🚀 Iniciando importación de diagramas...\n');
  
  for (const sheetName of possibleSheetNames) {
    try {
      console.log(`📊 Intentando con hoja: "${sheetName}"`);
      const result = await importFromGoogleSheet(SPREADSHEET_ID, sheetName);
      
      if (result.success) {
        console.log('\n✅ ¡Importación exitosa!');
        console.log(result);
        process.exit(0);
      }
    } catch (error: any) {
      if (error.message.includes('Unable to parse range')) {
        console.log(`   ❌ Hoja "${sheetName}" no encontrada`);
        continue;
      } else {
        console.error(`   ⚠️  Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n❌ No se pudo encontrar una hoja válida.');
  console.log('💡 Intenta especificar el nombre exacto de tu hoja en el script.');
  process.exit(1);
}

tryImport();
