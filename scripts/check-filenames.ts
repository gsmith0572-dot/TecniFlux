import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const checkFilenames = async () => {
  const result = await pool.query(
    'SELECT id, file_name, file_id FROM diagrams LIMIT 10'
  );
  
  console.log('Primeros 10 registros:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  await pool.end();
};

checkFilenames();
