import dotenv from "dotenv";
import express from "express";
import router from "../route/route.ts"
import { Log } from "../helper/middlewares/request.logger.ts";
import { testDbConn, sequelize } from "../config/dbConnect.ts"
import cors from 'cors';
dotenv.config();

const PORT: Number = Number(process.env.PORT) || 8086;
const app = express();

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:9898',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use('/', new Log().requestLogger, router);
// console.log(PORT);

await testDbConn();
// await sequelize.sync({alter: true}); 
await sequelize.sync();

app.listen(PORT, () => {
  console.log(`Server is running at port : ${PORT}`);
});