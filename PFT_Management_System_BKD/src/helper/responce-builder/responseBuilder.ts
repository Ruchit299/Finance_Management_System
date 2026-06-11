import type { Response } from "express";

export default class ResponseBuilder {
  static success(
    res: Response,
    statusCode: number,
    message: string,
    payload: Record<string, any> = {}
  ) {
    return res.status(statusCode).json({
      message,
      ...payload,
    });
  }

  static error(
    res: Response,
    statusCode: number,
    message: string,
    errorMsg: string | object | null = null
  ) {
    const response: Record<string, any> = { message };
    if (errorMsg) {
      response.error = errorMsg;
    }

    return res.status(statusCode).json(response);
  }
}
