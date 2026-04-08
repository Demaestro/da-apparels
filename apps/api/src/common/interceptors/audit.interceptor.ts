import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request } from "express";

/**
 * Logs all mutating requests (POST/PUT/PATCH/DELETE) with user context.
 * The AuditLog DB writes are done inside individual services for richer context.
 * This interceptor is a lightweight access log for observability.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger("AuditLog");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const { method, url, user, ip } = req;
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!mutating) return next.handle();

    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} — userId:${user?.id ?? "anon"} ip:${ip} [${ms}ms]`);
      }),
    );
  }
}
