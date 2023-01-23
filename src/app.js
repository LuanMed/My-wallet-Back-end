import express from "express";
import cors from "cors";
import authRouter from "./routes/AuthRoute.js";
import transactionsRouter from "./routes/TransRoute.js";

const app = express();

app.use(express.json());

app.use(cors());

app.use([authRouter, transactionsRouter]);

const PORT = 5000;

app.listen(PORT, () => console.log(`Servidor rodou na porta: ${PORT}`));