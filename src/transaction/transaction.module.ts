import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import TransactionRepository from './transaction.repository';
import TransactionController from './transaction.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import Transaction from './transaction.entity';
import Card from 'src/card/card.entitiy';

@Module({
  providers: [TransactionRepository, TransactionService],
  controllers: [TransactionController],
  imports: [
    TypeOrmModule.forFeature([Transaction, Card]),
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
