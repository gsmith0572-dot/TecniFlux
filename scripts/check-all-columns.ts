import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const checkColumns = async () => {
  const result = await pool.query(
    'SELECT * FROM diagrams LIMIT 5'
  );
  
  console.log('Columnas disponibles:', Object.keys(result.rows[0]));
  console.log('\nPrimeros 5 registros completos:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  await pool.end();
};

checkColumns();
