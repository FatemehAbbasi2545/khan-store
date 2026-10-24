import { MaxLength } from 'class-validator';
import { IsInt, IsString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  confirmPassword: string;
}

export class LoginCustomerDto {
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;

  @IsString()
  @MaxLength(64)
  captchaToken: string;

  @IsInt()
  captchaAnswer: number;
}
