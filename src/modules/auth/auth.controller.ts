import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtUser } from '../../common/types/jwt-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a technician account. Public registration cannot create administrators.' })
  @ApiBody({ type: RegisterDto, examples: { technician: { summary: 'Create technician', value: { name: 'Jordan Technician', email: 'jordan.technician@example.com', password: 'SecurePass123!' } } } })
  @ApiCreatedResponse({ description: 'Account created and JWT issued.' })
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Authenticate with email and password to receive a JWT.' })
  @ApiBody({ type: LoginDto, examples: { admin: { summary: 'Seeded administrator', value: { email: 'admin@fleetcore.example.com', password: 'AdminPass123!' } }, technician: { summary: 'Seeded technician', value: { email: 'alex.technician@fleetcore.example.com', password: 'TechPass123!' } } } })
  @ApiOkResponse({ description: 'JWT access token and basic user profile.' })
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Return the authenticated user claims from the access token.' })
  me(@CurrentUser() user: JwtUser) {
    return { id: user.sub, email: user.email, name: user.name, role: user.role, mechanicId: user.mechanicId ?? null };
  }
}
