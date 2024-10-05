import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from './services/services.module';
import { ControllersModule } from './controllers/controllers.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      host: process.env['DB_HOST'],
      port: parseInt(process.env['DB_PORT']) || 5432,
      username: process.env['DB_USERNAME'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_NAME'],
      type: 'postgres',
      autoLoadEntities: true,
    }),
    ServicesModule,
    ControllersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
