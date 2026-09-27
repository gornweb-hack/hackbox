import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { type Avatar, AVATARS } from '../users/users.service.js';

const ROLES = Object.values(Role);

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  login!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto {
  // Табельный номер, телефон или email — любая строка без пробелов
  @IsString()
  @Length(1, 64)
  @Matches(/^\S+$/, { message: 'login must not contain spaces' })
  login!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateUserDto extends RegisterDto {
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  crew?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  depot?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password?: string;

  // Пустая строка очищает бригаду или депо
  @IsOptional()
  @IsString()
  @MaxLength(100)
  crew?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  depot?: string;
}

// Сам сотрудник в своём профиле меняет только портрет; null — вернуть инициалы
export class UpdateMeDto {
  @ApiProperty({ enum: AVATARS, nullable: true, required: false })
  @IsOptional()
  @IsIn(AVATARS)
  avatar?: Avatar | null;
}
