import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../common/constants';
import { TransactionEvent } from 'src/common/proto/service';

@Injectable()
export class NotificationService {
  @OnEvent(Events.TRANSACTION_CLEARING_ACCEPTED)
  async sendClearingAcceptedNotification(
    event: TransactionEvent,
  ): Promise<boolean> {
    // Assume that it will always work
    Logger.debug(`sending clearing accepted notification: event ${event}`);
    return true;
  }

  @OnEvent(Events.TRANSACTION_CLEARING_REJECTED)
  async sendClearingRejectedNotification(
    event: TransactionEvent,
  ): Promise<boolean> {
    // Assume that it will always work
    Logger.debug(`sending clearing rejected notification: event ${event}`);
    return true;
  }

  @OnEvent(Events.TRANSACTION_AUTHORIZING_REJECTED)
  async sendAuthorizingRejectedNotification(
    event: TransactionEvent,
  ): Promise<boolean> {
    // Assume that it will always work
    Logger.debug(`sending authorizing rejected notification: event ${event}`);
    return true;
  }

  @OnEvent(Events.TRANSACTION_AUTHORIZING_ACCEPTED)
  async sendAuthorizingAcceptedNotification(
    event: TransactionEvent,
  ): Promise<boolean> {
    // Assume that it will always work
    Logger.debug(`sending authorizing accepted notification: event ${event}`);
    return true;
  }
}
