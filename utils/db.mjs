import pg from 'pg';

const { Pool } = pg;

// ตรวจสอบ connection string
if (!process.env.CONNECTION_STRING) {
  console.error('ERROR: CONNECTION_STRING is not set in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false // Supabase ต้องการ SSL
  }
});

// ทดสอบการเชื่อมต่อเมื่อเริ่มต้น
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// ทดสอบ connection
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connection test successful');
  })
  .catch((err) => {
    console.error('❌ Database connection test failed:', err.message);
    console.error('Please check your CONNECTION_STRING in .env file');
  });

export default pool;
