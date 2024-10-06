import { MessaageType, TransactionEvent } from '@common/proto/service';
import { KafkaContext } from '@nestjs/microservices';
import { Events } from '@common/constants';

export interface TransactionEventHandler {
  handle(
    event: TransactionEvent,
    ctx: KafkaContext,
    notificaitonStrategy: NotificationStrategy,
  ): Promise<void>;
  canHandler(messageType: MessaageType): boolean;
}

export type NotificationStrategy = (
  eventType: Events,
  transactionEvent: TransactionEvent,
  ctx: KafkaContext,
) => Promise<void>;
