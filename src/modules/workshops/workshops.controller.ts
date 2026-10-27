import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtUser } from '../../common/types/jwt-user';
import { UserRole, WorkshopStatus } from '../../common/types/enums';
import { UpdateWorkshopStatusDto } from '../../common/dto/update-workshop-status.dto';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopsService } from './workshops.service';

@ApiTags('Workshops')
@ApiBearerAuth('access-token')
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  @ApiOperation({ summary: 'List active workshops available for new maintenance assignments.' })
  listActive() { return this.workshopsService.listActive(); }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List active and inactive workshops (administrators only).' })
  listAll() { return this.workshopsService.list(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workshop by identifier.' })
  @ApiParam({ name: 'id', example: 1 })
  findById(@Param('id', ParseIntPipe) id: number) { return this.workshopsService.findById(id); }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a workshop.' })
  @ApiBody({ type: CreateWorkshopDto, examples: { workshop: { value: { name: 'Central Workshop', address: '123 Industrial Avenue, Barranquilla', status: 'ACTIVE' } } } })
  @ApiCreatedResponse({ description: 'Workshop created.' })
  create(@Body() dto: CreateWorkshopDto, @CurrentUser() user: JwtUser) { return this.workshopsService.create(dto, user.sub); }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update workshop details and/or status.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto, @CurrentUser() user: JwtUser) {
    return this.workshopsService.update(id, dto, user.sub);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or inactivate a workshop. Inactive workshops cannot receive new assignments.' })
  @ApiBody({ type: UpdateWorkshopStatusDto, examples: { deactivate: { value: { status: WorkshopStatus.INACTIVE } } } })
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopStatusDto, @CurrentUser() user: JwtUser) {
    return this.workshopsService.setStatus(id, dto.status, user.sub);
  }
}
