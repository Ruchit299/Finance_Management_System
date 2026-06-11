import express, { type Request, type Response, type NextFunction } from "express";
import authRouter from "../modules/auth/auth.routes.ts";
import userRouter from "../modules/user/user.routes.ts";

const router = express.Router();

router.get("/greet", (req: Request, res: Response) => {
  res.json({ Greet: "Hello.........." });
});

router.use("/auth", authRouter);
router.use("/users", userRouter);

export default router;