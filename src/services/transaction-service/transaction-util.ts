import { TransactionEvent } from '@common/proto/service';
import { mapProvider } from '@common/utils';
import Card from '@entities/card.entitiy';
import TransactionStatus from '@entities/transaction-status';
import Transaction from '@entities/transaction.entity';

export function createTranscation(
  event: TransactionEvent,
  card: Card,
  transactionStatus: TransactionStatus,
): Transaction {
  const trx = new Transaction();
  trx.amount = getEventAmount(event.amount).toString();
  trx.card = card;
  trx.currency = event.currency;
  trx.fractionalDigits = event.fractionalDigits;
  trx.feesAmount = getEventAmount(event.feesAmount).toString();
  trx.feesCurrency = event.feesCurrency;
  trx.feesFractionalDigits = event.feesFractionalDigits;
  trx.idempotencyKey = event.eventId;
  trx.psp = mapProvider(event.provider);
  trx.providerEventTime = event.providerEventTime;
  trx.reference = event.reference;
  trx.status = transactionStatus;
  return trx;
}

export function getEventAmount(amount: any): number | undefined {
  if (amount == undefined) {
    return undefined;
  }
  if (typeof amount === 'string') {
    return parseInt(amount);
  } else if (typeof amount === 'number') {
    return amount;
  } else {
    return amount.low as number;
  }
}
