import Card from 'src/entities/card.entitiy';
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

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'amount', type: 'bigint' })
  amount: number;

  @Column({ name: 'fractional_digits', type: 'int' })
  fractionalDigits: number;

  @Column({ name: 'currency' })
  currency: string;
}
