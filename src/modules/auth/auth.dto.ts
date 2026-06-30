import { IsEnum, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @Matches(/^03\d{9}$/, { message: 'Phone must be a valid Pakistani mobile number (03XXXXXXXXX)' })
  phone: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  businessName?: string;
}

export class LoginDto {
  @IsString()
  @Matches(/^03\d{9}$/, { message: 'Phone must be a valid Pakistani mobile number (03XXXXXXXXX)' })
  phone: string;

  @IsString()
  password: string;
}
