import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import BalanceCheckpoint from '@entities/blance-checkpoint.entity';
import Card from '@entities/card.entitiy';
import Transaction from '@entities/transaction.entity';
import { BalanceService } from '@services/balance-service/balance.service';
import { CardService } from '@services/card-service/card.service';
import { NotificationService } from '@services/notification-service/notification.service';
import { TransactionService } from '@services/transaction-service/transaction.service';
import { AnalyticsService } from '@services/analytics-service/analytics.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import AuthorizationEventHandler from '@services/transaction-service/authorization-event-handler.service';
import ValidatorModule from '@validators/validators.module';
import ClearingEventHandler from './transaction-service/clearing-event-handler.service';

@Module({
  imports: [
    ValidatorModule,
    TypeOrmModule.forFeature([Card, BalanceCheckpoint, Transaction]),
    ClientsModule.register([
      {
        name: 'TRANSACTION_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'], // TODO use env vars
          },
          run: {
            autoCommit: false,
          },
          consumer: {
            groupId: 'transaction-service-consumer-group', // TODO use env vars
          },
        },
      },
    ]),
  ],
  providers: [
    BalanceService,
    CardService,
    NotificationService,
    TransactionService,
    AnalyticsService,
    AuthorizationEventHandler,
    ClearingEventHandler,
  ],
  exports: [TransactionService],
})
export class ServicesModule {}
