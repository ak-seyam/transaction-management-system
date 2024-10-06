import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka, KafkaContext } from '@nestjs/microservices';
import {
  Ack,
  AckStatus,
  MessaageType,
  TransactionEvent,
  TransactionHistoryResponse,
  Transaction as TransactionDto,
  TransactionStatus as TransactionStatusDto,
} from '@common/proto/service';
import { InjectRepository } from '@nestjs/typeorm';
import Transaction from 'src/entities/transaction.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from 'src/common/constants';
import TransactionStatus from 'src/entities/transaction-status';
import { BalanceService } from '@services/balance-service/balance.service';
import Card from 'src/entities/card.entitiy';
import { mapProvider } from 'src/common/utils';
import { CardService } from '@services/card-service/card.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('TRANSACTION_SERVICE') private messageClient: ClientKafka,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private eventEmitter: EventEmitter2,
    private balanceService: BalanceService,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    private cardService: CardService,
  ) {}

  async receiveProviderTransactionEvent(event: TransactionEvent): Promise<Ack> {
    // TODO add event validation
    try {
      Logger.log(`sending ${event}`);
      await new Promise((resolve, reject) => {
        this.messageClient
          .emit<TransactionEvent>(
            'transactions_events', // TODO use env vars
            {
              key: event.reference, // using the reference number as key to insure the message ordering
              value: event,
            },
          )
          .subscribe({
            next: (event) => resolve(event),
            error: (error) => reject(error),
          });
      });
      return {
        status: AckStatus.SUCCESS,
        eventTime: new Date(),
      };
    } catch (e) {
      Logger.error(`Error in receving message ${e.message}`);
      return {
        status: AckStatus.FAILED,
        eventTime: new Date(),
      };
    }
  }

  async handleTransactionEvent(event: TransactionEvent, ctx: KafkaContext) {
    if (event.type === MessaageType.AUTHORIZATION) {
      await this.authorize(event, ctx);
    } else {
      await this.clear(event, ctx);
    }
  }

  async clear(event: TransactionEvent, ctx: KafkaContext) {
    const existingTransaction = await this.transactionRepository
      .createQueryBuilder('trx')
      .leftJoinAndSelect('trx.card', 'card')
      .where('trx.idempotencyKey = :id', { id: event.eventId })
      .getOne();
    if (existingTransaction != null) {
      Logger.warn(
        `duplicate clearning messages for trx ${existingTransaction.id}`,
      ); // To improve we can build alerts on this
      return;
    }

    const authorizationTrx = await this.transactionRepository.findOne({
      where: {
        reference: event.reference,
        status: TransactionStatus.AUTHORIZED,
      },
    });

    if (!authorizationTrx) {
      await this.notify(Events.TRANSACTION_CLEARING_REJECTED, event, ctx);
      return;
    }

    await this.validateClearingRequest(authorizationTrx, event, ctx);

    const card = await this.cardRepository.findOne({
      where: { cardToken: event.cardToken },
    });

    const clearingTrx = this.createTransaction(
      event,
      card,
      TransactionStatus.CLEARED,
    );

    await this.transactionRepository.save(clearingTrx);

    await this.notify(Events.TRANSACTION_CLEARING_ACCEPTED, event, ctx);
  }

  async notify(eventType: Events, event: TransactionEvent, ctx: KafkaContext) {
    await this.eventEmitter.emitAsync(eventType, event);
    await this.commit(ctx);
  }

  async authorize(event: TransactionEvent, ctx: KafkaContext) {
    const card = await this.cardRepository.findOne({
      where: {
        cardToken: event.cardToken,
      },
    });

    const balance = await this.balanceService.getBalance(card.id);

    const canCover = event.amount <= balance.amountInBaseCurrency;

    if (!canCover) {
      this.notify(Events.TRANSACTION_AUTHORIZING_REJECTED, event, ctx);
    }

    const authorizationTrx = this.createTransaction(
      event,
      card,
      TransactionStatus.AUTHORIZED,
    );

    await this.transactionRepository.save(authorizationTrx);

    await this.notify(Events.TRANSACTION_AUTHORIZING_ACCEPTED, event, ctx);
  }

  async commit(ctx: KafkaContext) {
    const { offset } = ctx.getMessage();
    const partition = ctx.getPartition();
    const topic = ctx.getTopic();
    const consumer = ctx.getConsumer();
    await consumer.commitOffsets([{ topic, partition, offset }]);
  }

  private createTransaction(
    event: TransactionEvent,
    card: Card,
    status: TransactionStatus,
  ) {
    const trx = new Transaction();
    trx.amount = event.amount;
    trx.card = card;
    trx.amount = event.amount;
    trx.currency = event.currency;
    trx.fractionalDigits = event.fractionalDigits;
    trx.feesAmount = event.feesAmount;
    trx.feesCurrency = event.feesCurrency;
    trx.feesFractionalDigits = event.feesFractionalDigits;
    trx.idempotencyKey = event.eventId;
    trx.psp = mapProvider(event.provider);
    trx.providerEventTime = event.providerEventTime;
    trx.reference = event.reference;
    trx.status = status;
    return trx;
  }

  async validateClearingRequest(
    authorizationTrx: Transaction,
    event: TransactionEvent,
    ctx: KafkaContext,
  ) {
    if (!event.amount) {
      this.commit(ctx);
      throw new Error('Invalid amount'); // TODO use domain speicfic error
    }
    if (event.amount != authorizationTrx.amount) {
      this.commit(ctx);
      throw new Error('Invalid amount'); // TODO use domain speicfic error
    }
    const existingClearingRequest = await this.transactionRepository.findOne({
      where: {
        reference: authorizationTrx.reference,
        status: TransactionStatus.CLEARED,
      },
    });
    if (existingClearingRequest != null) {
      await this.notify(Events.TRANSACTION_AUTHORIZING_REJECTED, event, ctx);
      throw new Error('Transaction clearing already exist'); // TODO use domain speicfic error
    }
  }

  async getTransactionHistory(
    userId: string,
  ): Promise<TransactionHistoryResponse> {
    const transactions = await this.transactionRepository
      .createQueryBuilder('trx')
      .leftJoinAndSelect('trx.card', 'card')
      .where('card.userId = :userId', { userId })
      .getMany();

    const successfulTranscations = transactions.filter(
      (trx) => trx.status === TransactionStatus.CLEARED,
    );

    const pendingTransactions = transactions.filter(
      (trx) => trx.status === TransactionStatus.AUTHORIZED,
    );

    const reducedTransactions = this.reduceTrasnactions(
      pendingTransactions,
      successfulTranscations,
    );

    const transactionDtos =
      await this.mapToTransactionHistoryDtos(reducedTransactions);

    return {
      currentTime: new Date(),
      transactions: transactionDtos,
    };
  }

  private reduceTrasnactions(
    pendingTransactions: Transaction[],
    successfulTranscations: Transaction[],
  ) {
    const res = [];
    for (const trx of pendingTransactions) {
      const successfulTransactionToBeAdded = successfulTranscations.find(
        (successfulTrx) => successfulTrx.reference === trx.reference,
      );
      if (successfulTransactionToBeAdded) {
        res.push(successfulTransactionToBeAdded);
      } else {
        res.push(trx);
      }
    }
    return res;
  }

  reducedStatus(newTrx: TransactionDto, existingTrx: TransactionDto) {
    if (newTrx.status === TransactionStatusDto.SUCCESSFUL) {
      return TransactionStatusDto.SUCCESSFUL;
    } else {
      return existingTrx.status;
    }
  }

  async mapToTransactionHistoryDtos(
    transactions: Transaction[],
  ): Promise<TransactionDto[]> {
    return Promise.all(
      transactions.map(async (trx) => {
        return await this.mapTransactionToTransactionHistoryDto(trx);
      }),
    );
  }

  async mapTransactionToTransactionHistoryDto(
    trx: Transaction,
  ): Promise<TransactionDto> {
    return {
      cardDetails: await this.cardService.getCardDetails(trx?.card.cardToken),
      id: trx.id,
      reference: trx.reference,
      status:
        trx.status == TransactionStatus.AUTHORIZED
          ? TransactionStatusDto.PENDING
          : TransactionStatusDto.SUCCESSFUL,
      total: {
        amount: trx.amount,
        currency: trx.currency,
        fractionalDigits: trx.fractionalDigits,
      },
    };
  }
}
