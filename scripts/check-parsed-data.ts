import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const checkParsedData = async () => {
  const total = await pool.query('SELECT COUNT(*) FROM diagrams');
  const withMake = await pool.query('SELECT COUNT(*) FROM diagrams WHERE make IS NOT NULL');
  const withModel = await pool.query('SELECT COUNT(*) FROM diagrams WHERE model IS NOT NULL');
  const withYear = await pool.query('SELECT COUNT(*) FROM diagrams WHERE year IS NOT NULL');
  const withSystem = await pool.query('SELECT COUNT(*) FROM diagrams WHERE system IS NOT NULL');
  
  console.log('📊 DATOS EXISTENTES EN LA BASE DE DATOS:');
  console.log('='.repeat(50));
  console.log(`Total de diagramas:     ${total.rows[0].count}`);
  console.log(`Con marca (make):       ${withMake.rows[0].count} (${(withMake.rows[0].count/total.rows[0].count*100).toFixed(1)}%)`);
  console.log(`Con modelo (model):     ${withModel.rows[0].count} (${(withModel.rows[0].count/total.rows[0].count*100).toFixed(1)}%)`);
  console.log(`Con año (year):         ${withYear.rows[0].count} (${(withYear.rows[0].count/total.rows[0].count*100).toFixed(1)}%)`);
  console.log(`Con sistema (system):   ${withSystem.rows[0].count} (${(withSystem.rows[0].count/total.rows[0].count*100).toFixed(1)}%)`);
  console.log('='.repeat(50));
  
  // Mostrar ejemplos con make/model/year
  const examples = await pool.query(
    'SELECT file_name, make, model, year, system FROM diagrams WHERE make IS NOT NULL LIMIT 10'
  );
  
  console.log('\n📝 EJEMPLOS CON MAKE/MODEL/YEAR:');
  console.log(JSON.stringify(examples.rows, null, 2));
  
  await pool.end();
};

checkParsedData();
