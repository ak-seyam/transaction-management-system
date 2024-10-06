import BalanceCheckpoint from '@entities/blance-checkpoint.entity';
import Transaction from '@entities/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cards' })
export default class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_token', unique: true })
  cardToken: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'limit_amount' })
  limitAmount: number;

  @Column({
    name: 'limit_currency',
    comment: 'Assume that currency have only one currency for simplicity',
  })
  limitCurrency: string;

  @Column({ name: 'fractional_digits' })
  limitFractionalDigits: number;

  @OneToMany(() => BalanceCheckpoint, (checkpoint) => checkpoint.card)
  balanceCheckpoints: BalanceCheckpoint[];

  @OneToMany(() => Transaction, (transaction) => transaction.card)
  transactions: Transaction[];
}
