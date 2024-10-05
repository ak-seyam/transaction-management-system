import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import CardTestService from './card-test';
import { TypeOrmModule } from '@nestjs/typeorm';
import Card from './card.entitiy';
import BalanceCheckpoint from 'src/card/blance-checkpoint.entity';
import Transaction from 'src/transaction/transaction.entity';

@Module({
  providers: [CardService, CardService, CardTestService],
  imports: [TypeOrmModule.forFeature([Card, BalanceCheckpoint, Transaction])],
})
export class CardModule {}
