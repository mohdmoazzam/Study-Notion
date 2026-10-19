export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }

  static badRequest = (message: string) => new AppError(400, message);
  static unauthorized = (message: string) => new AppError(401, message);
  static forbidden = (message: string) => new AppError(403, message);
  static notFound = (message: string) => new AppError(404, message);
  static conflict = (message: string) => new AppError(409, message);
  static badGateway = (message: string) => new AppError(502, message);
}
