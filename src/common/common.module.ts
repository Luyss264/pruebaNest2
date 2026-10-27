import { Global, Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Global()
@Module({
  providers: [PasswordService, ApiKeyGuard],
  exports: [PasswordService, ApiKeyGuard],
})
export class CommonModule {}
