import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationStrategy,
  TransactionEventHandler,
} from './transaction-event-handler';
import { TransactionEvent, MessaageType } from '@common/proto/service';
import { KafkaContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import Transaction from '@entities/transaction.entity';
import { Repository } from 'typeorm';
import Card from '@entities/card.entitiy';
import TransactionStatus from '@entities/transaction-status';
import { Events } from '@common/constants';
import { createTranscation } from './transaction-util';

@Injectable()
export default class ClearingEventHandler implements TransactionEventHandler {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
  ) {}

  async handle(
    event: TransactionEvent,
    ctx: KafkaContext,
    notificaitonStrategy: NotificationStrategy,
  ): Promise<void> {
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
      await notificaitonStrategy(
        Events.TRANSACTION_CLEARING_REJECTED,
        event,
        ctx,
      );
      return;
    }

    await this.validateClearingRequest(
      authorizationTrx,
      event,
      ctx,
      notificaitonStrategy,
    );

    const card = await this.cardRepository.findOne({
      where: { cardToken: event.cardToken },
    });

    const clearingTrx = createTranscation(
      event,
      card,
      TransactionStatus.CLEARED,
    );

    await this.transactionRepository.save(clearingTrx);

    await notificaitonStrategy(
      Events.TRANSACTION_CLEARING_ACCEPTED,
      event,
      ctx,
    );
  }
  canHandler(messageType: MessaageType): boolean {
    return messageType == MessaageType.CLEARING;
  }

  async validateClearingRequest(
    authorizationTrx: Transaction,
    event: TransactionEvent,
    ctx: KafkaContext,
    notificaitonStrategy: NotificationStrategy,
  ) {
    if (!event.amount) {
      await notificaitonStrategy(
        Events.TRANSACTION_CLEARING_REJECTED,
        event,
        ctx,
      );
      throw new Error('Invalid amount'); // TODO use domain speicfic error
    }
    if (event.amount != authorizationTrx.amount) {
      await notificaitonStrategy(
        Events.TRANSACTION_CLEARING_REJECTED,
        event,
        ctx,
      );
      throw new Error('Invalid amount'); // TODO use domain speicfic error
    }
    const existingClearingRequest = await this.transactionRepository.findOne({
      where: {
        reference: authorizationTrx.reference,
        status: TransactionStatus.CLEARED,
      },
    });
    if (existingClearingRequest != null) {
      await notificaitonStrategy(
        Events.TRANSACTION_AUTHORIZING_REJECTED,
        event,
        ctx,
      );
      throw new Error('Transaction clearing already exist'); // TODO use domain speicfic error
    }
  }
}
