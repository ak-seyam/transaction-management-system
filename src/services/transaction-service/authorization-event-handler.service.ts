import { MessaageType, TransactionEvent } from '@common/proto/service';
import { KafkaContext } from '@nestjs/microservices';
import {
  NotificationStrategy,
  TransactionEventHandler,
} from './transaction-event-handler';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Transaction from '@entities/transaction.entity';
import { DataSource, Repository } from 'typeorm';
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
    private dataSource: DataSource,
  ) {}

  canHandler(messageType: MessaageType): boolean {
    return messageType == MessaageType.AUTHORIZATION;
  }

  async handle(
    event: TransactionEvent,
    ctx: KafkaContext,
    notificationStrategy: NotificationStrategy,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();
      // lock the card
      const card = await queryRunner.manager
        .getRepository(Card)
        .createQueryBuilder('card')
        .setLock('pessimistic_write')
        .where('card.id = :id', { id: event.cardToken })
        .getOne();

      const balance = await this.balanceService.getBalance(card, queryRunner);

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

      await queryRunner.commitTransaction();

      await notificationStrategy(
        Events.TRANSACTION_AUTHORIZING_ACCEPTED,
        event,
        ctx,
      );
    } catch (e) {
      Logger.error(`Got erro ${e} while authorizing`, e);
      await queryRunner.rollbackTransaction();
    }
  }
}
