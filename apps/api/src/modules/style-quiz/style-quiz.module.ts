import { Module } from "@nestjs/common";
import { StyleQuizService } from "./style-quiz.service";
import { StyleQuizController } from "./style-quiz.controller";

@Module({
  providers: [StyleQuizService],
  controllers: [StyleQuizController],
})
export class StyleQuizModule {}
