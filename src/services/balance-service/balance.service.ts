import { Injectable } from '@nestjs/common';
import BalanceCheckpoint from '@entities/blance-checkpoint.entity';
import { MoreThan, QueryRunner, Repository } from 'typeorm';
import Card from '@entities/card.entitiy';
import Transaction from '@entities/transaction.entity';
import Money from '@common/money';
import TransactionStatus from '@entities/transaction-status';

@Injectable()
export class BalanceService {
  constructor() {}

  /**
   * NOTE: this transaction is expected to to be run within a transaction
   * @returns the balance for the user
   */
  async getBalance(card: Card, queryRunner: QueryRunner) {
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
    const utilizationAfterLastCheckpoint =
      this.calculateUtilization(transactions);

    const balance = new Money({
      amount: this.calculateBalanceAmount(
        card,
        latestBalanceCheckpoint,
        utilizationAfterLastCheckpoint,
      ),
      fractionalDigits: card.limitFractionalDigits,
      currency: card.limitCurrency,
    });

    // create checkpoint
    await this.createNewBalanceCheckpoint(
      queryRunner.manager.getRepository(BalanceCheckpoint),
      card,
      balance,
    );

    return balance;
  }

  calculateBalanceAmount(
    card: Card,
    latestBalanceCheckpoint: BalanceCheckpoint,
    utilizationAfterLastCheckpoint: number,
  ): number {
    if (latestBalanceCheckpoint) {
      const amountAsNumber = parseInt(
        latestBalanceCheckpoint.amount.toString(),
      );
      return amountAsNumber - utilizationAfterLastCheckpoint;
    }
    return card.limitAmount - utilizationAfterLastCheckpoint;
  }

  private calculateUtilization(transactions: Transaction[]): number {
    const visitedTransactions = new Set(); // we should take into consider the authorized transactions as well
    let sum = 0;
    for (const trx of transactions) {
      if (visitedTransactions.has(trx.reference)) {
        continue;
      }
      sum += parseInt(trx.amount.toString());
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

  private async createNewBalanceCheckpoint(
    repo: Repository<BalanceCheckpoint>,
    card: Card,
    balance: Money,
  ) {
    const checkpoint = new BalanceCheckpoint();
    checkpoint.card = card;
    checkpoint.amount = `${balance.amountInBaseCurrency}`;
    checkpoint.currency = balance.currency;
    checkpoint.fractionalDigits = balance.fractionalDigits;
    return await repo.save(checkpoint);
  }

  private async getTransactionsFrom(
    repo: Repository<Transaction>,
    createdAt: Date,
    card: Card,
  ) {
    if (!createdAt) {
      return await repo.find({
        where: { card, status: TransactionStatus.AUTHORIZED },
      });
    }
    // const transactions = await repo
    //   .createQueryBuilder('trx')
    //   .where('trx.createdAt > :createdAt and status = :status', {
    //     createdAt,
    //     status: TransactionStatus.AUTHORIZED,
    //   })
    //   .getMany();
    const transactions = await repo.findBy({
      status: TransactionStatus.AUTHORIZED,
      createdAt: MoreThan(createdAt),
    });
    return transactions;
  }
}
