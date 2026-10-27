import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';

async function runSeed(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    await application.get(SeederService).seed();
  } finally {
    await application.close();
  }
}

runSeed().catch((error: unknown) => {
  console.error('FleetCore seeding failed:', error);
  process.exitCode = 1;
});
