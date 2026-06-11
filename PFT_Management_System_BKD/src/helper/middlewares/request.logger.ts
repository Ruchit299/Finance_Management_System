import type { Request, Response, NextFunction } from "express";



export class Log {
    public requestLogger(req: Request, res: Response, next: NextFunction) {
        res.on("finish", () => {
            console.log(`${req.ip}: ${req.method}: ${req.path}: ${res.statusCode}`);
        });
        next();
    }
}