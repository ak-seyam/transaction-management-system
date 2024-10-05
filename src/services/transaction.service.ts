import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  Ack,
  AckStatus,
  MessaageType,
  TransactionEvent,
} from '../common/proto/service';
import { InjectRepository } from '@nestjs/typeorm';
import Transaction from 'src/entities/transaction.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from 'src/common/constants';
import TransactionStatus from 'src/entities/transaction-status';
import { BalanceService } from './balance.service';
import Card from 'src/entities/card.entitiy';
import { mapProvider } from 'src/common/utils';

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

  async handleTransactionEvent(event: TransactionEvent) {
    if (event.type === MessaageType.AUTHORIZATION) {
      await this.authorize(event);
    } else {
      await this.clear(event);
    }
  }

  async clear(event: TransactionEvent) {
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
      await this.notify(Events.TRANSACTION_CLEARING_REJECTED, event);
      return;
    }

    await this.validateClearingRequest(authorizationTrx, event);

    const card = await this.cardRepository.findOne({
      where: { cardToken: event.cardToken },
    });

    const clearingTrx = this.createTransaction(
      event,
      card,
      TransactionStatus.CLEARED,
    );

    await this.transactionRepository.save(clearingTrx);

    await this.notify(Events.TRANSACTION_CLEARING_ACCEPTED, event);
  }

  async notify(eventType: Events, event: TransactionEvent) {
    await this.eventEmitter.emitAsync(eventType, event);
  }

  async authorize(event: TransactionEvent) {
    const card = await this.cardRepository.findOne({
      where: {
        cardToken: event.cardToken,
      },
    });

    const balance = await this.balanceService.getBalance(card.id);

    const canCover = event.amount <= balance.amountInBaseCurrency;

    if (!canCover) {
      this.notify(Events.TRANSACTION_AUTHORIZING_REJECTED, event);
    }

    const authorizationTrx = this.createTransaction(
      event,
      card,
      TransactionStatus.AUTHORIZED,
    );

    await this.transactionRepository.save(authorizationTrx);

    await this.notify(Events.TRANSACTION_AUTHORIZING_ACCEPTED, event);
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
  ) {
    if (!event.amount) {
      throw new Error('Invalid amount'); // TODO use domain speicfic error
    }
    if (event.amount != authorizationTrx.amount) {
      throw new Error('Invalid amount'); // TODO use domain speicfic error
    }
    const existingClearingRequest = await this.transactionRepository.findOne({
      where: {
        reference: authorizationTrx.reference,
        status: TransactionStatus.CLEARED,
      },
    });
    if (existingClearingRequest != null) {
      await this.notify(Events.TRANSACTION_AUTHORIZING_REJECTED, event);
      throw new Error('Transaction clearing already exist'); // TODO use domain speicfic error
    }
  }
}
