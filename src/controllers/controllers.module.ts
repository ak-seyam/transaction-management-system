import { Module } from '@nestjs/common';
import TransactionController from './transaction.controller';
import { ServicesModule } from 'src/services/services.module';

@Module({
  controllers: [TransactionController],
  imports: [ServicesModule],
})
export class ControllersModule {}
