import 'dotenv/config';
import { Sequelize, type Dialect } from 'sequelize';
import messages from '../helper/constants/messages.ts';

const clean = (val?: string): string | undefined => {
  if (!val) return undefined;
  return val.trim().replace(/^['"]|['"]$/g, '').trim();
};

const DB_NAME: string = clean(process.env.DB_DBNAME) ?? clean(process.env.DB_DATABASE) ?? 'task_TS';
const DB_USERNAME: string = clean(process.env.DB_USERNAME) ?? 'root';
const DB_PASSWORD: string = clean(process.env.DB_PASSWORD) ?? 'root';
const DB_DIALECT = (clean(process.env.DB_DIALECT) ?? 'mysql') as Dialect;
const DB_HOST: string = clean(process.env.DB_HOST) ?? 'localhost';
const DB_PORT: number | undefined = process.env.DB_PORT ? Number(clean(process.env.DB_PORT)) : undefined;

const isLocalHost = (host: string): boolean => {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('172.')
  );
};

const dialectOptions: Record<string, any> = {
  connectTimeout: 60000
};

// Only enable SSL for remote / cloud databases (TiDB Cloud requires TLSv1.2)
if (!isLocalHost(DB_HOST)) {
  dialectOptions.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };
}

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  ...(DB_PORT ? { port: DB_PORT } : {}),
  dialect: DB_DIALECT,
  logging: false,
  dialectOptions,
  pool: {
    max: 2,
    min: 1,
    acquire: 20000,
    idle: 10000
  }
});

export async function testDbConn(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log(messages.SUCCESS.DB_CONN_SUCCESS);
  } catch (error) {
    console.error(messages.ERROR.DB_CONN_ERR, error);
  }
}

export { sequelize };
