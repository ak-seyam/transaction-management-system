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
import Transaction from '@entities/transaction.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from '@common/constants';
import TransactionStatus from '@entities/transaction-status';
import Card from '@entities/card.entitiy';
import { CardService } from '@services/card-service/card.service';
import EventValidator from '@validators/event-validator.validator';
import AuthorizationEventHandler from '@services/transaction-service/authorization-event-handler.service';
import ClearingEventHandler from '@services/transaction-service/clearing-event-handler.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('TRANSACTION_SERVICE') private messageClient: ClientKafka,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private eventEmitter: EventEmitter2,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    private cardService: CardService,
    private eventValidator: EventValidator,
    private authorizationEventHandler: AuthorizationEventHandler,
    private clearingEventHandler: ClearingEventHandler,
  ) {}

  async receiveProviderTransactionEvent(event: TransactionEvent): Promise<Ack> {
    // TODO add event validation
    this.eventValidator.validateEvent(event);
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
      await this.authorizationEventHandler.handle(event, ctx, this.notify);
    } else {
      await this.clearingEventHandler.handle(event, ctx, this.notify);
    }
  }

  private async notify(
    eventType: Events,
    event: TransactionEvent,
    ctx: KafkaContext,
  ) {
    await this.eventEmitter.emitAsync(eventType, event);
    await this.commit(ctx);
  }

  private async commit(ctx: KafkaContext) {
    const { offset } = ctx.getMessage();
    const partition = ctx.getPartition();
    const topic = ctx.getTopic();
    const consumer = ctx.getConsumer();
    await consumer.commitOffsets([{ topic, partition, offset }]);
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
