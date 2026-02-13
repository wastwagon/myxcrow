import { Controller, Get, Param, Query, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.SUPPORT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.usersService.listUsers({
      search,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id/role')
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Param('id') id: string, @Body() body: { roles: UserRole[] }) {
    return this.usersService.updateUserRoles(id, body.roles);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  async updateUserStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.updateUserStatus(id, body.isActive);
  }

  @Put(':id/approve')
  @Roles(UserRole.ADMIN)
  async approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }
}

