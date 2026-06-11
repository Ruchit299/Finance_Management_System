import express, { type Request, type Response, type NextFunction } from "express";

const router = express.Router();

router.get("/greet", (req: Request, res: Response) => {
  res.json({ Greet: "Hello.........." });
});

export default router;