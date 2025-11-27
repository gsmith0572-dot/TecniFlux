import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const analyzePatterns = async () => {
  // Archivos CON make (exitosos)
  const withMake = await pool.query(
    'SELECT file_name, make, model, year FROM diagrams WHERE make IS NOT NULL LIMIT 50'
  );
  
  // Archivos SIN make (fallidos)
  const withoutMake = await pool.query(
    'SELECT file_name, make, model, year FROM diagrams WHERE make IS NULL LIMIT 50'
  );
  
  console.log('✅ PATRONES EXITOSOS (CON MAKE):');
  console.log('='.repeat(80));
  withMake.rows.forEach(row => {
    console.log(`"${row.file_name}" → Make: ${row.make}, Model: ${row.model}, Year: ${row.year}`);
  });
  
  console.log('\n❌ PATRONES FALLIDOS (SIN MAKE):');
  console.log('='.repeat(80));
  withoutMake.rows.forEach(row => {
    console.log(`"${row.file_name}" → Model: ${row.model}`);
  });
  
  await pool.end();
};

analyzePatterns();
