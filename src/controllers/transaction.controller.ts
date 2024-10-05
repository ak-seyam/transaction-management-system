import { Controller } from '@nestjs/common';
import {
  Ack,
  TransactionEvent,
  TransactionHistoryRequest,
  TransactionHistoryResponse,
  TransactionServiceController,
  TransactionServiceControllerMethods,
} from '../common/proto/service';
import { TransactionService } from '../services/transaction.service';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

@Controller('transaction')
@TransactionServiceControllerMethods()
export default class TransactionController
  implements TransactionServiceController
{
  constructor(private service: TransactionService) {}

  async getTransactionHistory(
    request: TransactionHistoryRequest,
  ): Promise<TransactionHistoryResponse> {
    return await this.service.getTransactionHistory(request.userId);
  }

  async sendTransactionEvent(request: TransactionEvent): Promise<Ack> {
    return await this.service.receiveProviderTransactionEvent(request);
  }

  @EventPattern('transactions_events')
  async handleTranasctionEvent(
    @Payload() data: TransactionEvent,
    @Ctx() ctx: KafkaContext,
  ) {
    await this.service.handleTransactionEvent(data, ctx);
  }
}
