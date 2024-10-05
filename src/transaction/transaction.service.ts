import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Ack, AckStatus, TransactionEvent } from '../common/proto/service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('TRANSACTION_SERVICE') private messageClient: ClientKafka,
  ) {}

  async receiveProviderTransactionEvent(event: TransactionEvent): Promise<Ack> {
    // TODO add event validation
    try {
      Logger.log(`sending ${event}`);
      await this.messageClient
        .emit<TransactionEvent>(
          'transactions_events', // TODO use env vars
          {
            key: event.reference, // using the reference number as key to insure the message ordering
            value: event,
          },
        )
        .toPromise(); // Note: using the same event for simplicity
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
}
