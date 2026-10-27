import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/types/enums';
import { AuditsService } from './audits.service';

@ApiTags('Audit logs')
@ApiBearerAuth('access-token')
@Controller('audits')
@Roles(UserRole.ADMIN)
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent audit events (administrators only).' })
  @ApiQuery({ name: 'limit', required: false, example: 100, description: 'Maximum number of records, capped at 500.' })
  list(@Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : 100;
    return this.auditsService.list(Number.isFinite(parsed) ? parsed : 100);
  }
}
