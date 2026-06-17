const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cdp_db',
  user: 'postgres',
  password: 'postgres'
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('Connected!');
    const result = await client.query('SELECT NOW()');
    console.log(result.rows[0]);
    client.release();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
