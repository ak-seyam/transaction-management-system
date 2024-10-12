import Card from '@entities/card.entitiy';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'balance_checkpoints' })
export default class BalanceCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn({ name: 'card_id' })
  @Index()
  @ManyToOne(() => Card, (card) => card.balanceCheckpoints)
  card: Card;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'amount', type: 'bigint' })
  amount: string;

  @Column({ name: 'fractional_digits', type: 'int' })
  fractionalDigits: number;

  @Column({ name: 'currency' })
  currency: string;
}
