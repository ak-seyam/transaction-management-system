import BalanceCheckpoint from '@entities/blance-checkpoint.entity';
import { BalanceService } from './balance.service';
import Card from '@entities/card.entitiy';
import Transaction from '@entities/transaction.entity';
import { QueryRunner, Repository } from 'typeorm';
import PSP from '@entities/transaction-psp';
import TransactionStatus from '@entities/transaction-status';

describe('Balance service unit test suite', () => {
  const balanceService: BalanceService = new BalanceService();

  it('should calculate balance amount from last checkpoint', () => {
    // given
    const cardBalance = 100000;
    const card = getTestCard(cardBalance);
    const cardBalanceInLastCheckpoint = 30000;
    const lastCheckpoint = getTestLastCheckpoint(
      cardBalanceInLastCheckpoint,
      card,
    );
    const utilizationAfterLastCheckpoint = 1000;
    // when
    const actual = balanceService.calculateBalanceAmount(
      card,
      lastCheckpoint,
      utilizationAfterLastCheckpoint,
    );
    // then
    const expected =
      cardBalanceInLastCheckpoint - utilizationAfterLastCheckpoint;
    expect(actual).toEqual(expected);
  });

  it('should calculate balance correctly if there is no last checkpoint', () => {
    // given
    const cardBalance = 100000;
    const card = getTestCard(cardBalance);
    const lastCheckpoint = null;
    const utilizationAfterLastCheckpoint = 1000;
    // when
    const actual = balanceService.calculateBalanceAmount(
      card,
      lastCheckpoint,
      utilizationAfterLastCheckpoint,
    );
    // then
    const expected = cardBalance - utilizationAfterLastCheckpoint;
    expect(actual).toEqual(expected);
  });

  it('should getBalance correctly using existing transctions from last checkpoint [No existing transactions No existing checkpoint]', async () => {
    // given
    const mockedTransactions: Promise<Transaction[]> = new Promise((resolve) =>
      resolve([]),
    );
    const mockedLastCheckpoint: Promise<BalanceCheckpoint | null | undefined> =
      new Promise((resolve) => resolve(null));
    const queryRunner = getMockedQueryRunner(
      mockedLastCheckpoint,
      mockedTransactions,
    );
    const cardBalance = 100_000;
    const mockedCard = getTestCard(cardBalance);

    // when
    const balance = await balanceService.getBalance(mockedCard, queryRunner);

    // then
    expect(balance.amountInBaseCurrency).toEqual(cardBalance);
  });

  it('should getBalance correctly using existing transctions from last checkpoint [with existing transactions with existing checkpoint]', async () => {
    // given
    const cardBalance = 100_000;
    const card = getTestCard(cardBalance);
    const lastCheckpoint = getTestLastCheckpoint(40_000, card);
    const existingTransactions = [
      getTestTranasction(60_000, card, TransactionStatus.AUTHORIZED),
    ];
    const mockedTransactions: Promise<Transaction[]> = new Promise((resolve) =>
      resolve(existingTransactions),
    );
    const mockedLastCheckpoint: Promise<BalanceCheckpoint | null | undefined> =
      new Promise((resolve) => resolve(lastCheckpoint));
    const queryRunner = getMockedQueryRunner(
      mockedLastCheckpoint,
      mockedTransactions,
    );

    // when
    const balance = await balanceService.getBalance(card, queryRunner);

    // then
    expect(balance.amountInBaseCurrency).toEqual(
      parseInt(lastCheckpoint.amount) -
        parseInt(existingTransactions[0].amount),
    );
  });

  it('should getBalance correctly using existing transctions from last checkpoint [with existing transactions no existing checkpoint]', async () => {
    // given
    const cardBalance = 100_000;
    const card = getTestCard(cardBalance);
    const lastCheckpoint = null;
    const existingTransactions = [
      getTestTranasction(60_000, card, TransactionStatus.AUTHORIZED),
    ];
    const mockedTransactions: Promise<Transaction[]> = new Promise((resolve) =>
      resolve(existingTransactions),
    );
    const mockedLastCheckpoint: Promise<BalanceCheckpoint | null | undefined> =
      new Promise((resolve) => resolve(lastCheckpoint));
    const queryRunner = getMockedQueryRunner(
      mockedLastCheckpoint,
      mockedTransactions,
    );

    // when
    const balance = await balanceService.getBalance(card, queryRunner);

    // then
    expect(balance.amountInBaseCurrency).toEqual(
      cardBalance - parseInt(existingTransactions[0].amount),
    );
  });

  it('should getBalance correctly using existing transctions from last checkpoint [with existing more than one transaction no existing checkpoint]', async () => {
    // given
    const cardBalance = 100_000;
    const card = getTestCard(cardBalance);
    const lastCheckpoint = null;
    const existingTransactions = [
      getTestTranasction(60_000, card, TransactionStatus.AUTHORIZED, 'ref1'),
      getTestTranasction(10_000, card, TransactionStatus.AUTHORIZED, 'ref2'),
    ];
    const mockedTransactions: Promise<Transaction[]> = new Promise((resolve) =>
      resolve(existingTransactions),
    );
    const mockedLastCheckpoint: Promise<BalanceCheckpoint | null | undefined> =
      new Promise((resolve) => resolve(lastCheckpoint));
    const queryRunner = getMockedQueryRunner(
      mockedLastCheckpoint,
      mockedTransactions,
    );

    // when
    const balance = await balanceService.getBalance(card, queryRunner);

    // then
    expect(balance.amountInBaseCurrency).toEqual(
      cardBalance -
        existingTransactions
          .map((trx) => parseInt(trx.amount))
          .reduce((acc: number, val: number) => acc + val, 0),
    );
  });

  function getTestTranasction(
    amount: number,
    card: Card,
    status: TransactionStatus,
    ref: string = 'reference_213',
  ): Transaction {
    return {
      amount: amount.toString(),
      currency: 'AED',
      card: card,
      createdAt: new Date(),
      feesAmount: '0',
      feesCurrency: 'AED',
      feesFractionalDigits: 2,
      fractionalDigits: 2,
      id: 'trx_id_1234',
      idempotencyKey: 'idempotency_key_123',
      providerEventTime: new Date(),
      psp: PSP.PSP1,
      reference: ref,
      status: status,
      updatedAt: new Date(),
    };
  }

  function getTestLastCheckpoint(
    amount: number,
    card: Card,
  ): BalanceCheckpoint {
    return {
      amount: amount.toString(),
      card,
      createdAt: new Date(),
      currency: 'AED',
      fractionalDigits: 2,
      id: 'checkpoint-id123',
    };
  }

  function getTestCard(limitAmount: number): Card {
    return {
      balanceCheckpoints: undefined,
      cardToken: 'card_token_2134',
      id: 'card_id_213',
      limitAmount: limitAmount,
      limitCurrency: 'AED',
      limitFractionalDigits: 2,
      transactions: [],
      userId: 'user_id_2134',
    };
  }

  function getMockedQueryRunner(
    mockLastCheckpoint: Promise<BalanceCheckpoint>,
    mockTransactions: Promise<Transaction[]>,
  ): QueryRunner {
    const transactionRepo = {
      find: jest.fn(() => mockTransactions),
      findBy: jest.fn(() => mockTransactions),
    } as unknown as Repository<Transaction>;

    const balanceCheckpointRepo = {
      findOne: jest.fn(() => mockLastCheckpoint),
      save: jest.fn(() => mockLastCheckpoint),
    } as unknown as Repository<BalanceCheckpoint>;

    const queryRunner = {
      manager: {
        getRepository: jest.fn((param) => {
          if (param === Transaction) {
            return transactionRepo;
          } else if (param === BalanceCheckpoint) {
            return balanceCheckpointRepo;
          }
        }),
      },
    } as unknown as QueryRunner;
    return queryRunner;
  }
});
