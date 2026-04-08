import { IsEnum, IsArray, IsString, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { QuizBodyType } from "@prisma/client";

export class SubmitQuizDto {
  @IsEnum(QuizBodyType)
  bodyType: QuizBodyType;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  preferredColors: string[]; // hex codes

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  preferredStyles: string[]; // e.g. ["minimalist", "formal"]

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  occasions: string[]; // e.g. ["office", "gala"]
}
