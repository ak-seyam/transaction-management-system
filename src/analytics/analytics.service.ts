import { Injectable, Logger } from '@nestjs/common';
import { TransactionEvent } from 'src/common/proto/service';

@Injectable()
export class AnalyticsService {
  async sendTransactionEvent(event: TransactionEvent): Promise<boolean> {
    Logger.debug(`sending event ${event} to analytics`);
    return true;
  }
}
