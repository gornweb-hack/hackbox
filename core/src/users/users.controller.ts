import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles } from '../auth/auth.guard.js';
import { CreateUserDto, UpdateUserDto } from '../auth/dto.js';
import { toProfile, type UserProfile, UsersService } from './users.service.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Публичные поля {id, name, role}; ?ids=a,b — только эти пользователи
  @Get()
  list(@Query('ids') ids?: string) {
    return this.users.listPublic(ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : undefined);
  }

  // Сотрудников заводит администратор
  @Post()
  @Roles(['ADMIN'])
  async create(@Body() dto: CreateUserDto): Promise<UserProfile> {
    return toProfile(await this.users.create(dto));
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<UserProfile> {
    return this.users.update(id, dto);
  }
}
