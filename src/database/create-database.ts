import 'dotenv/config';
import { Client } from 'pg';

function stringToBoolean(value?: string): boolean {
  if (!value) return false;
  return value.toLowerCase() === 'true' || value === '1';
}

async function createDatabase() {
  let connectionConfig: any;

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      user: url.username,
      password: url.password,
      database: 'postgres',
    };
  } else {
    const host = process.env.DB_PRIMARY_HOST;
    const port = parseInt(process.env.DB_PRIMARY_PORT ?? '5432', 10);
    const ssl = stringToBoolean(process.env.DB_PRIMARY_SSL);
    const sslRejectUnauthorized = stringToBoolean(process.env.DB_PRIMARY_SSL_REJECT_UNAUTHORIZED);

    connectionConfig = {
      host,
      port,
      user: process.env.DB_PRIMARY_USERNAME,
      password: process.env.DB_PRIMARY_PASSWORD,
      database: 'postgres',
      ssl: ssl ? { rejectUnauthorized: sslRejectUnauthorized } : undefined,
    };
  }

  const client = new Client(connectionConfig);
  const dbName = process.env.DB_PRIMARY_DATABASE;

  if (!dbName) {
    console.error('❌ Thiếu DB_PRIMARY_DATABASE trong file .env');
    process.exit(1);
  }

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`🛠️  Database "${dbName}" không tồn tại. Đang tạo...`);
      await client.query(
        `CREATE DATABASE "${dbName}" WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0`,
      );
      console.log(`✅ Database "${dbName}" đã được tạo với UTF8.`);
    } else {
      console.log(`✅ Database "${dbName}" đã tồn tại.`);
    }
  } catch (err) {
    console.error('❌ Lỗi khi tạo database:', err);
  } finally {
    await client.end();
  }
}

void createDatabase();
