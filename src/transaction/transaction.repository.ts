import { Injectable } from '@nestjs/common';
import Transaction from './transaction.entity';

@Injectable()
export default class TransactionRepository {
  async createTransaction(): Promise<Transaction> {
    // TODO implement this
    return new Transaction();
  }
}
