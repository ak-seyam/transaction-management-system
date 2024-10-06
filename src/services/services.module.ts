import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import BalanceCheckpoint from 'src/entities/blance-checkpoint.entity';
import Card from 'src/entities/card.entitiy';
import Transaction from 'src/entities/transaction.entity';
import { BalanceService } from './balance-service/balance.service';
import { CardService } from '@services/card-service/card.service';
import { NotificationService } from './notification-service/notification.service';
import { TransactionService } from '@services/transaction-service/transaction.service';
import { AnalyticsService } from './analytics-service/analytics.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
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
  ],
  exports: [TransactionService],
})
export class ServicesModule {}
