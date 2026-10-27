import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtUser } from '../../common/types/jwt-user';
import { UserRole } from '../../common/types/enums';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List user accounts without exposing password hashes.' })
  list() { return this.usersService.list(); }

  @Post()
  @ApiOperation({ summary: 'Create a user with an explicit role (administrators only).' })
  @ApiBody({ type: CreateUserDto, examples: { technician: { value: { name: 'Morgan Technician', email: 'morgan.technician@example.com', password: 'TechnicianPass123!', role: 'TECHNICIAN' } }, admin: { value: { name: 'Fleet Administrator', email: 'new.admin@fleetcore.example.com', password: 'AdminPass123!', role: 'ADMIN' } } } })
  @ApiCreatedResponse({ description: 'User account created.' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser) { return this.usersService.create(dto, user.sub); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user name, role, or active state.' })
  @ApiParam({ name: 'id', example: 2 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtUser) {
    return this.usersService.update(id, dto, user.sub);
  }
}
