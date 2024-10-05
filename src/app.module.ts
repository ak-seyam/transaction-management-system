import { Module } from '@nestjs/common';
import { TransactionModule } from './transaction/transaction.module';
import { CardModule } from './card/card.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './notification/notification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import config from './config/config';

@Module({
  imports: [
    TransactionModule,
    CardModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: `${process.env.PROFILE || 'dev'}.env`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get('database');
      },
    }),
    NotificationModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
