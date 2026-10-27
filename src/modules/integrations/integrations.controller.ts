import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { MaintenancesService } from '../maintenances/maintenances.service';

@ApiTags('External integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Get('vehicles/:identifier/maintenance-history')
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('partner-api-key')
  @ApiHeader({ name: 'x-api-key', required: true, example: 'demo-key-partner-1', description: 'One of the comma-separated API_KEYS configured in the environment.' })
  @ApiOperation({ summary: 'Get vehicle availability and maintenance history for an external partner. Uses x-api-key instead of a JWT.' })
  @ApiParam({ name: 'identifier', example: 'ABC123', description: 'Vehicle numeric identifier or plate.' })
  @ApiOkResponse({ description: 'Vehicle summary with its maintenance history.', schema: { example: { success: true, statusCode: 200, data: { vehicle: { id: 1, plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', available: true }, maintenances: [{ id: 12, type: 'PREVENTIVE', status: 'COMPLETED', description: 'Oil and filter replacement', mileage: 45000, cost: 350000, finishedAt: '2026-09-15T16:30:00.000Z', mechanic: { id: 1, name: 'Alex Rivera' }, workshop: { id: 1, name: 'Central Workshop' } }] }, timestamp: '2026-10-20T19:00:00.000Z' } } })
  history(@Param('identifier') identifier: string) {
    return this.maintenancesService.historyByVehicleIdOrPlate(identifier);
  }
}
