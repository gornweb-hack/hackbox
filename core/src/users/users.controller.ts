import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../common/swagger.js';
import { AuthGuard, CurrentUser, Roles } from '../auth/auth.guard.js';
import { CreateUserDto, UpdateUserDto } from '../auth/dto.js';
import type { AuthUser } from '../auth/tokens.js';
import { toProfile, type UserProfile, UsersService } from './users.service.js';

@ApiTags('Сотрудники')
@ApiAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Публичные поля {id, name, role}; админу — ещё login, email, createdAt. ?ids=a,b — только эти пользователи
  @ApiOperation({ summary: 'Список сотрудников', description: 'Публичные поля {id, name, role, crew, depot}; администратору — ещё login, email, createdAt. ?ids=a,b — только эти сотрудники' })
  @Get()
  list(@CurrentUser() user: AuthUser, @Query('ids') ids?: string) {
    const only = ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : undefined;
    return this.users.list(only, user.role === 'ADMIN');
  }

  // Сотрудников заводит администратор
  @ApiOperation({ summary: 'Завести сотрудника', description: 'Только ADMIN' })
  @Post()
  @Roles(['ADMIN'])
  async create(@Body() dto: CreateUserDto): Promise<UserProfile> {
    return toProfile(await this.users.create(dto));
  }

  @ApiOperation({ summary: 'Изменить сотрудника', description: 'Только ADMIN. Пустая строка в crew или depot очищает поле' })
  @Patch(':id')
  @Roles(['ADMIN'])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<UserProfile> {
    return this.users.update(id, dto);
  }
}
