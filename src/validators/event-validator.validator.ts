import { TransactionEvent } from '@common/proto/service';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class EventValidator {
  validateEvent(transactionEvent: TransactionEvent) {
    this.checkAllFieldsNotNull(transactionEvent);
    this.checkAmounts(transactionEvent);
  }
  private checkAllFieldsNotNull(transactionEvent: TransactionEvent) {
    for (const key in transactionEvent) {
      if (transactionEvent[key] == null || transactionEvent[key] == undefined) {
        throw new Error('Field has an empty value'); // TODO throw a domain specific error
      }
    }
  }

  private checkAmounts(transactionEvent: TransactionEvent) {
    if (transactionEvent.amount === 0) {
      throw new Error('amount cannot be zero');
    }
    if (transactionEvent.feesAmount < 0) {
      throw new Error('fees cannot be negative');
    }
  }
}
