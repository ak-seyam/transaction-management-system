import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from '@services/services.module';
import { ControllersModule } from '@controllers/controllers.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import TypeOrmConfig from '@config/typeorm-config';

@Module({
  imports: [
    TypeOrmModule.forRoot(TypeOrmConfig),
    ServicesModule,
    ControllersModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
