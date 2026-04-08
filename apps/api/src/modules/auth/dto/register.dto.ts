import { IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Please provide a valid email address." })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters." })
  @MaxLength(72, { message: "Password too long." })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
