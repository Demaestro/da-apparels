import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  async healthcheck() {
    return this.health.getReadiness();
  }

  @Public()
  @Get("live")
  liveness() {
    return this.health.getLiveness();
  }

  @Public()
  @Get("ready")
  async readiness() {
    return this.health.assertReady();
  }
}
