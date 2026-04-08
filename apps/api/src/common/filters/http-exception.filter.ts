import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Global HTTP exception filter — transforms all errors into the standard
 * ApiResponse envelope: { success, message, errors? }.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "An unexpected error occurred.";
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === "string") {
        message = response;
      } else if (typeof response === "object" && response !== null) {
        const r = response as Record<string, unknown>;
        message = (r.message as string) ?? message;
        // class-validator returns message as string[]
        if (Array.isArray(r.message)) {
          errors = { validation: r.message as string[] };
          message = "Validation failed.";
        }
      }
    } else {
      this.logger.error(`Unhandled exception on ${req.method} ${req.url}`, exception);
    }

    res.status(status).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }
}
