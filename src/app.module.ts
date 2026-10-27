import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { CommonModule } from './common/common.module';
import { AuditsModule } from './modules/audits/audits.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { MechanicsModule } from './modules/mechanics/mechanics.module';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { MaintenancesModule } from './modules/maintenances/maintenances.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { SeederModule } from './database/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().port().default(3000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_NAME: Joi.string().required(),
        DB_SSL: Joi.string().valid('true', 'false').default('false'),
        DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('true'),
        JWT_SECRET: Joi.string().min(24).required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        API_KEYS: Joi.string().required(),
        BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
        CORS_ORIGIN: Joi.string().default('*'),
      }),
      validationOptions: { abortEarly: false, allowUnknown: true },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        retryAttempts: 10,
        retryDelay: 2000,
      }),
    }),
    CommonModule,
    AuditsModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
    IntegrationsModule,
    SeederModule,
  ],
})
export class AppModule {}
