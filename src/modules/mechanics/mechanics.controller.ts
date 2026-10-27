import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtUser } from '../../common/types/jwt-user';
import { MechanicStatus, UserRole } from '../../common/types/enums';
import { UpdateMechanicStatusDto } from '../../common/dto/update-mechanic-status.dto';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { MechanicsService } from './mechanics.service';

@ApiTags('Mechanics')
@ApiBearerAuth('access-token')
@Controller('mechanics')
@Roles(UserRole.ADMIN)
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Get()
  @ApiOperation({ summary: 'List mechanics, including inactive records for historical traceability.' })
  list() { return this.mechanicsService.list(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get one mechanic by identifier.' })
  @ApiParam({ name: 'id', example: 1 })
  findById(@Param('id', ParseIntPipe) id: number) { return this.mechanicsService.findById(id); }

  @Post()
  @ApiOperation({ summary: 'Register a mechanic and optionally link an active TECHNICIAN user.' })
  @ApiBody({ type: CreateMechanicDto, examples: { mechanic: { value: { name: 'Carlos Perez', email: 'carlos.perez@example.com', specialty: 'Diesel engines', status: 'ACTIVE', userId: 2 } } } })
  @ApiCreatedResponse({ description: 'Mechanic created.' })
  create(@Body() dto: CreateMechanicDto, @CurrentUser() user: JwtUser) { return this.mechanicsService.create(dto, user.sub); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mechanic details or change the linked technician user.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMechanicDto, @CurrentUser() user: JwtUser) {
    return this.mechanicsService.update(id, dto, user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or inactivate a mechanic without deleting maintenance history.' })
  @ApiBody({ type: UpdateMechanicStatusDto, examples: { deactivate: { value: { status: MechanicStatus.INACTIVE } }, activate: { value: { status: MechanicStatus.ACTIVE } } } })
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMechanicStatusDto, @CurrentUser() user: JwtUser) {
    return this.mechanicsService.setStatus(id, dto.status, user.sub);
  }
}
