import 'dotenv/config';
import { Sequelize, type Dialect } from 'sequelize';
import messages from '../helper/constants/messages.ts';

const DB_NAME: string = process.env.DB_DBNAME ?? 'task_TS';
const DB_USERNAME: string = process.env.DB_USERNAME ?? 'root';
const DB_PASSWORD: string = process.env.DB_PASSWORD ?? 'root';
const DB_DIALECT = (process.env.DB_DIALECT ?? 'mysql') as Dialect;
const DB_HOST: string = process.env.DB_HOST ?? 'localhost';

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT
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
