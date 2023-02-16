import { Router } from "express";
import { signUp, signIn } from "../controller/Auth.js";
import { validateSchema } from "../middleware/ValidateSchema.js";
import { userSchema, loginSchema } from "../schema/AuthSchema.js";

const authRouter = Router();

authRouter.post("/users", validateSchema(userSchema), signUp);
authRouter.post("/logged", validateSchema(loginSchema), signIn);

export default authRouter;