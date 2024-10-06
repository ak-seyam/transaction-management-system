import { MessaageType, TransactionEvent } from '@common/proto/service';
import { KafkaContext } from '@nestjs/microservices';
import {
  NotificationStrategy,
  TransactionEventHandler,
} from './transaction-event-handler';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Transaction from '@entities/transaction.entity';
import { Repository } from 'typeorm';
import { BalanceService } from '@services/balance-service/balance.service';
import Card from '@entities/card.entitiy';
import { Events } from '@common/constants';
import { createTranscation } from '@services/transaction-service/transaction-util';
import TransactionStatus from '@entities/transaction-status';

@Injectable()
export default class AuthorizationEventHandler
  implements TransactionEventHandler
{
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private balanceService: BalanceService,
    @InjectRepository(Card) private cardRepository: Repository<Card>,
  ) {}

  canHandler(messageType: MessaageType): boolean {
    return messageType == MessaageType.AUTHORIZATION;
  }

  async handle(
    event: TransactionEvent,
    ctx: KafkaContext,
    notificationStrategy: NotificationStrategy,
  ): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: {
        cardToken: event.cardToken,
      },
    });

    const balance = await this.balanceService.getBalance(card.id);

    const canCover = event.amount <= balance.amountInBaseCurrency;

    if (!canCover) {
      await notificationStrategy(
        Events.TRANSACTION_AUTHORIZING_REJECTED,
        event,
        ctx,
      );
    }

    const authorizationTrx = createTranscation(
      event,
      card,
      TransactionStatus.AUTHORIZED,
    );

    await this.transactionRepository.save(authorizationTrx);

    await notificationStrategy(
      Events.TRANSACTION_AUTHORIZING_ACCEPTED,
      event,
      ctx,
    );
  }
}
