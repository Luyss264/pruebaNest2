import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtUser } from '../../common/types/jwt-user';
import { MaintenanceStatus, UserRole } from '../../common/types/enums';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenancesService } from './maintenances.service';

@ApiTags('Maintenances')
@ApiBearerAuth('access-token')
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Get('active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all SCHEDULED and IN_PROGRESS maintenances (administrators only).' })
  listActive() { return this.maintenancesService.listActive(); }

  @Get('mine')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'List maintenances assigned to the authenticated technician.' })
  mine(@CurrentUser() user: JwtUser) { return this.maintenancesService.listForTechnician(user); }

  @Get('vehicle/:vehicleId/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get the complete maintenance history for a vehicle.' })
  @ApiParam({ name: 'vehicleId', example: 1 })
  vehicleHistory(@Param('vehicleId', ParseIntPipe) vehicleId: number) { return this.maintenancesService.historyForVehicle(vehicleId); }

  @Get('vehicle/:vehicleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List maintenances for a vehicle.' })
  @ApiParam({ name: 'vehicleId', example: 1 })
  forVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) { return this.maintenancesService.list({ vehicleId }); }

  @Get('mechanic/:mechanicId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List maintenances assigned to a mechanic.' })
  @ApiParam({ name: 'mechanicId', example: 1 })
  forMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) { return this.maintenancesService.list({ mechanicId }); }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List and filter maintenances (administrators only).' })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'vehicleId', required: false, example: 1 })
  @ApiQuery({ name: 'mechanicId', required: false, example: 1 })
  @ApiQuery({ name: 'activeOnly', required: false, example: true })
  list(@Query() query: MaintenanceQueryDto) { return this.maintenancesService.list(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance details. Technicians may only access their own assignments.' })
  @ApiParam({ name: 'id', example: 1 })
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.maintenancesService.getByIdForUser(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule a maintenance after validating the vehicle, mechanic, workshop and time slot.' })
  @ApiBody({ type: CreateMaintenanceDto, examples: { preventive: { value: { vehicleId: 1, mechanicId: 1, workshopId: 1, type: 'PREVENTIVE', description: 'Replace engine oil and filters.', mileage: 45500, scheduledStartAt: '2027-01-15T13:30:00.000Z', scheduledEndAt: '2027-01-15T15:00:00.000Z', referenceCode: 'FLEET-WO-2027-0001' } }, corrective: { value: { vehicleId: 2, mechanicId: 2, workshopId: 1, type: 'CORRECTIVE', description: 'Inspect and replace worn brake pads.', mileage: 32000, scheduledStartAt: '2027-01-16T14:00:00.000Z', scheduledEndAt: '2027-01-16T16:00:00.000Z' } } } })
  @ApiCreatedResponse({ description: 'Maintenance created in SCHEDULED status.' })
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: JwtUser) { return this.maintenancesService.create(dto, user.sub); }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Apply a permitted state transition. Technicians may update their own assignments only.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateMaintenanceStatusDto, examples: {
    start: { summary: 'Start work', value: { status: 'IN_PROGRESS' } },
    complete: { summary: 'Complete work with mandatory closure details', value: { status: 'COMPLETED', workPerformed: 'Replaced oil and filters; inspected engine and belts.', finalCost: 350000, finishedAt: '2027-01-15T15:10:00.000Z', finalMileage: 46000 } },
    cancel: { summary: 'Cancel a scheduled or in-progress maintenance', value: { status: 'CANCELLED' } },
  } })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaintenanceStatusDto, @CurrentUser() user: JwtUser) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}
