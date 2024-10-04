import { Module } from '@nestjs/common';
import { CardDetailsService } from './card-details/card-details.service';

@Module({
  providers: [CardDetailsService],
})
export class CardModule {}
