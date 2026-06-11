import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import messages from "../constants/messages.ts";

// Extend Express Request type to include "user"
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
      isAdmin: boolean;
    };
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: messages.ERROR.NO_TOKEN });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: messages.ERROR.TOKEN_FORMAT });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      isAdmin: decoded.isAdmin,


    };

    next();
  } catch (error) {
    return res.status(401).json({ message: messages.ERROR.INVALID_TOKEN });
  }
};

const isAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: messages.ERROR.ADMIN_REQUIRED });
  }
  next();
};

export { verifyToken, isAdmin };
