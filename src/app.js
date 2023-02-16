import express from "express";
import cors from "cors";
import authRouter from "./routes/AuthRoute.js";
import transactionsRouter from "./routes/TransRoute.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors());

app.use([authRouter, transactionsRouter]);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Servidor rodou na porta: ${port}`));