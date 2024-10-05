import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import TransactionRepository from './transaction.repository';
import TransactionController from './transaction.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  providers: [TransactionRepository, TransactionService],
  controllers: [TransactionController],
  imports: [
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
})
export class TransactionModule {}
