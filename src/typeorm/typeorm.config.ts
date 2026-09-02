import { join } from 'path';
import { DataSource } from 'typeorm';

require('dotenv').config();

export const stringToBoolean = (value: string | boolean) => {
  try {
    return Boolean(JSON.parse(`${value}`));
  } catch (error) {
    console.error(`Error parsing value to boolean: ${value}`, error);
    return false;
  }
};

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_PRIMARY_HOST,
  port: +process.env.DB_PRIMARY_PORT,
  username: process.env.DB_PRIMARY_USERNAME,
  password: process.env.DB_PRIMARY_PASSWORD,
  database: process.env.DB_PRIMARY_DATABASE,
  ssl: stringToBoolean(process.env.DB_PRIMARY_SSL),
  synchronize: false,
  extra: {
    ssl: stringToBoolean(process.env.DB_PRIMARY_SSL)
      ? {
          rejectUnauthorized: stringToBoolean(process.env.DB_PRIMARY_SSL_REJECT_UNAUTHORIZED),
        }
      : null,
  },
  logging: false,
  entities: [join(__dirname, '../entities/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
});
