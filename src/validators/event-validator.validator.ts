import { TransactionEvent } from '@common/proto/service';
import { Injectable } from '@nestjs/common';
import { getEventAmount } from '@services/transaction-service/transaction-util';

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
    const trxAmount = getEventAmount(transactionEvent.amount);
    if (!trxAmount || trxAmount === 0) {
      throw new Error('amount is required and cannot be zero');
    }
    const feesAmount = getEventAmount(transactionEvent.feesAmount);
    if (feesAmount && feesAmount <= 0) {
      throw new Error('fees cannot be negative');
    }
  }
}
