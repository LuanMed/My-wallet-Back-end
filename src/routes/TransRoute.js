import { Router } from "express";
import { deleteTransaction, inputTransaction, listTransactions } from "../controller/Transactions.js";
import { authValidation } from "../middleware/AuthMiddleware.js";
import { validateSchema } from "../middleware/ValidateSchema.js";
import { transSchema } from "../schema/TransSchema.js";

const transactionsRouter = Router();

transactionsRouter.use(authValidation);
transactionsRouter.get("/transactions", listTransactions);
transactionsRouter.post("/transactions", validateSchema(transSchema), inputTransaction);
transactionsRouter.delete("/transactions/:id", deleteTransaction);

export default transactionsRouter;