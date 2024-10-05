import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BalanceCheckpoint from './blance-checkpoint.entity';
import { DataSource, Repository } from 'typeorm';
import Card from './card.entitiy';
import Transaction from 'src/transaction/transaction.entity';
import Money from 'src/common/money';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(BalanceCheckpoint)
    private dataSource: DataSource,
  ) {}

  private async getBalance(cardId: string) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      // lock the card
      const card = await queryRunner.manager
        .getRepository(Card)
        .createQueryBuilder('card')
        .setLock('pessimistic_write')
        .where('card.id = :id', { id: cardId })
        .getOne();
      if (!card) {
        throw new Error('Invalid card id'); // TODO through domain specific error
      }

      // get latest balance checkpoint
      const latestBalanceCheckpoint = await this.getLatestBalanceCheckpoint(
        queryRunner.manager.getRepository(BalanceCheckpoint),
        card,
      );

      // get all transactions from that balance
      const transactions = await this.getTransactionsFrom(
        queryRunner.manager.getRepository(Transaction),
        latestBalanceCheckpoint?.createdAt,
        card,
      );

      // calculate the balance
      const balanceAmount = this.calculateBalance(transactions);

      const balance = new Money({
        amount: balanceAmount,
        fractionalDigits: card.limitFractionalDigits,
        currency: card.limitCurrency,
      });

      // commit transaction
      await queryRunner.commitTransaction();
      // return balance

      return balance;
    } catch (e) {
      Logger.error(`error while getting balance`, e);
      await queryRunner.rollbackTransaction();
    }
  }

  calculateBalance(transactions: Transaction[]): number {
    const visitedTransactions = new Set(); // we should take into consider the authorized transactions as well
    let sum = 0;
    for (const trx of transactions) {
      if (visitedTransactions.has(trx.reference)) {
        continue;
      }
      sum += trx.amount;
      visitedTransactions.add(trx.reference);
    }
    return sum;
  }
  private async getLatestBalanceCheckpoint(
    repo: Repository<BalanceCheckpoint>,
    card: Card,
  ) {
    const latestBalanceCheckpoint = await repo.findOne({
      where: { card },
      order: {
        createdAt: 'DESC',
      },
    });
    return latestBalanceCheckpoint;
  }

  async createNewBalanceCheckpoint(
    repo: Repository<BalanceCheckpoint>,
    card: Card,
    balance: Money,
  ) {
    const checkpoint = new BalanceCheckpoint();
    checkpoint.card = card;
    checkpoint.amount = balance.amountInBaseCurrency;
    checkpoint.currency = balance.currency;
    checkpoint.fractionalDigits = balance.fractionalDigits;
    return await repo.save(checkpoint);
  }

  async getTransactionsFrom(
    repo: Repository<Transaction>,
    createdAt: Date,
    card: Card,
  ) {
    if (!createdAt) {
      return await repo.find({ where: { card } });
    } else {
    }
    const transactions = await repo
      .createQueryBuilder('trx')
      .where('trx.createdAt > :createdAt', { createdAt })
      .getMany();
    return transactions;
  }
}
