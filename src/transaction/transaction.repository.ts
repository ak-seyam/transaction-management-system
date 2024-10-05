import { Injectable } from '@nestjs/common';
import Transaction from './transaction.entity';

@Injectable()
export default class TransactionRepository {
  async createTransa1ction(): Promise<Transaction> {
    // TODO implement this
    return new Transaction();
  }
}
