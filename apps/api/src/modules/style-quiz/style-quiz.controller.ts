import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { StyleQuizService } from "./style-quiz.service";
import { SubmitQuizDto } from "./dto/submit-quiz.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";

@Controller("style-quiz")
@UseGuards(JwtAuthGuard)
export class StyleQuizController {
  constructor(private quiz: StyleQuizService) {}

  @Public()
  @Get("questions")
  questions() {
    return { success: true, data: this.quiz.getQuestions() };
  }

  @Post("submit")
  async submit(@Req() req: { user: { id: string } }, @Body() dto: SubmitQuizDto) {
    return { success: true, data: await this.quiz.submit(req.user.id, dto) };
  }

  @Get("result")
  async result(@Req() req: { user: { id: string } }) {
    return { success: true, data: await this.quiz.getResult(req.user.id) };
  }
}
