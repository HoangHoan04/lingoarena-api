import 'dotenv/config';
import { dataSource } from '../typeorm/typeorm.config';

function maskPassword(str: string): string {
  const match = str.match(/(:\/\/)([^:]+):([^@]+)(@)/);
  if (match) {
    const password = match[3];
    const masked = password.substring(0, 3) + '*'.repeat(password.length - 3);
    return str.replace(password, masked);
  }
  return str;
}

async function testConnection() {
  console.log('Connection Info:');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.DATABASE_URL) {
    console.log(`Database URL: ${maskPassword(process.env.DATABASE_URL)}`);
  } else {
    console.log(`Host: ${process.env.DB_PRIMARY_HOST}`);
    console.log(`Port: ${process.env.DB_PRIMARY_PORT}`);
    console.log(`Database: ${process.env.DB_PRIMARY_DATABASE}`);
    console.log(`Username: ${process.env.DB_PRIMARY_USERNAME}`);
  }

  console.log('\nAttempting to connect...\n');

  try {
    const startTime = Date.now();
    await dataSource.initialize();
    const connectionTime = Date.now() - startTime;

    console.log('Database connection successful!');
    console.log(`Connection time: ${connectionTime}ms\n`);

    const dbInfo = await dataSource.query(`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `);

    console.log('Database Information:');
    console.log(`PostgreSQL: ${dbInfo[0].version.split(' ')[1]}`);
    console.log(`Database: ${dbInfo[0].database}`);
    console.log(`User: ${dbInfo[0].user}`);
    console.log(`   Server: ${dbInfo[0].server_ip || 'localhost'}:${dbInfo[0].server_port}`);

    const sizeInfo = await dataSource.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `);
    console.log(`   Size: ${sizeInfo[0].size}`);

    console.log('\nTables in Database:');
    const tables = await dataSource.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.length > 0) {
      console.log(`Found ${tables.length} tables:\n`);
    } else {
      console.log('No tables found. Database is empty.');
      console.log('Run migrations to create tables:');
      console.log('npm run typeorm migration:run');
    }

    try {
      const migrations = await dataSource.query(`
        SELECT * FROM "migrations" ORDER BY "timestamp" DESC LIMIT 5;
      `);

      if (migrations.length > 0) {
        console.log('\nRecent Migrations:');
        migrations.forEach((migration: any) => {
          const date = new Date(parseInt(migration.timestamp));
          console.log(`${migration.name}`);
          console.log(`Run at: ${date.toLocaleString()}`);
        });
      }
    } catch (err) {
      console.log('\nMigrations table not found.');
      console.log('This is normal for a fresh database.');
    }

    console.log('\nTesting Database Permissions:');
    try {
      await dataSource.query(
        `CREATE TABLE IF NOT EXISTS _test_permissions (id SERIAL PRIMARY KEY)`,
      );
      await dataSource.query(`DROP TABLE IF EXISTS _test_permissions`);
      console.log('Read & Write permissions: OK');
    } catch (err) {
      console.log('Write permission test failed');
      console.log('Error:', (err as Error).message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('CONNECTION TEST SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════');

    console.log('\nNext Steps:');
    if (tables.length === 0) {
      console.log('Run migrations: npm run typeorm migration:run');
      console.log('Start server: npm run start:dev');
      console.log('Test API endpoints');
    } else {
      console.log('Database is ready!');
      console.log('Start server: npm run start:dev');
      console.log('API Docs: http://localhost:4320/api');
    }
  } catch (error: any) {
    console.log('═══════════════════════════════════════════════════════');
    console.error('DATABASE CONNECTION FAILED!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.error('Error details:');
    console.error('Message:', (error as Error).message);

    if (error.code) {
      console.error('   Code:', error.code);
    }

    console.log('Common error codes:');
    console.log('ENOTFOUND: Wrong host/DNS issue');
    console.log('ECONNREFUSED: Port blocked or wrong port');
    console.log('28P01: Authentication failed (wrong password)');
    console.log('ETIMEDOUT: Network/firewall issue\n');

    console.log('═══════════════════════════════════════════════════════');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Connection closed.');
    }
  }

  process.exit(0);
}

void testConnection();
