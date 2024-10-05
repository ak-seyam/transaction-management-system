import { Controller } from '@nestjs/common';
import {
  Ack,
  TransactionEvent,
  TransactionServiceController,
  TransactionServiceControllerMethods,
} from '../common/proto/service';
import { TransactionService } from '../services/transaction.service';
import { EventPattern } from '@nestjs/microservices';

@Controller('transaction')
@TransactionServiceControllerMethods()
export default class TransactionController
  implements TransactionServiceController
{
  constructor(private service: TransactionService) {}

  async getTransactionEvent(request: TransactionEvent): Promise<Ack> {
    return await this.service.receiveProviderTransactionEvent(request);
  }

  @EventPattern('transactions_events')
  async handleTranasctionEvent(data: Record<string, TransactionEvent>) {
    await this.service.handleTransactionEvent(data.value);
  }
}
