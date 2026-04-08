import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";

// Role hierarchy — higher index = more privileged
const ROLE_HIERARCHY: Role[] = ["CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN"];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const userLevel = ROLE_HIERARCHY.indexOf(user.role as Role);
    const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY.indexOf(r)));

    if (userLevel < minRequired) {
      throw new ForbiddenException("Insufficient permissions.");
    }
    return true;
  }
}
