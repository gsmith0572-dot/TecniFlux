import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const addDocTypeColumn = async () => {
  try {
    console.log('Adding doc_type column to diagrams table...');
    
    await pool.query(`
      ALTER TABLE diagrams 
      ADD COLUMN IF NOT EXISTS doc_type VARCHAR(100)
    `);
    
    console.log('✅ Column added successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
};

addDocTypeColumn();
