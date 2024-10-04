import { Module } from '@nestjs/common';
import TransactionRepository from './transaction.repository';

@Module({
  providers: [TransactionRepository],
})
export class TransactionModule {}
