import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtUser } from '../../common/types/jwt-user';
import { UserRole } from '../../common/types/enums';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all fleet vehicles. Authentication is required.' })
  list() { return this.vehiclesService.list(); }

  @Get('plate/:plate')
  @ApiOperation({ summary: 'Find a vehicle by its plate.' })
  @ApiParam({ name: 'plate', example: 'ABC123' })
  findByPlate(@Param('plate') plate: string) { return this.vehiclesService.findByPlate(plate); }

  @Get(':id')
  @ApiOperation({ summary: 'Find a vehicle by identifier.' })
  @ApiParam({ name: 'id', example: 1 })
  findById(@Param('id', ParseIntPipe) id: number) { return this.vehiclesService.findById(id); }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a vehicle. New vehicles start as AVAILABLE.' })
  @ApiBody({ type: CreateVehicleDto, examples: { vehicle: { value: { plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2023, mileage: 45000 } } } })
  @ApiCreatedResponse({ description: 'Vehicle created.' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: JwtUser) { return this.vehiclesService.create(dto, user.sub); }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update vehicle details, reactivate an inactive vehicle, or inactivate an available vehicle.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto, @CurrentUser() user: JwtUser) {
    return this.vehiclesService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Logical delete: set vehicle status to INACTIVE without deleting maintenance history.' })
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) { return this.vehiclesService.deactivate(id, user.sub); }
}
