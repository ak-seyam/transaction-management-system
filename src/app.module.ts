import { Module } from '@nestjs/common';
import { TransactionModule } from './transaction/transaction.module';
import { CardModule } from './card/card.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './notification/notification.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    TransactionModule,
    CardModule,
    UserModule,
    TypeOrmModule.forRoot({
      host: process.env['DB_HOST'],
      port: parseInt(process.env['DB_PORT']) || 5432,
      username: process.env['DB_USERNAME'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_NAME'],
      type: 'postgres',
      autoLoadEntities: true,
    }),
    NotificationModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
