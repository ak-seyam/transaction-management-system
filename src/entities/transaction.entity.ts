import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import TransactionStatus from '@entities/transaction-status';
import PSP from '@entities/transaction-psp';
import Card from '@entities/card.entitiy';

@Entity()
export default class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reference: string;

  @Column()
  currency: string;

  @Column({ name: 'fractional_digits' })
  fractionalDigits: number;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'simple-enum' })
  status: TransactionStatus;

  @Column({ name: 'fees_currency', nullable: true })
  feesCurrency: string;

  @Column({ name: 'fractional_digits', nullable: true })
  feesFractionalDigits: number;

  @Column({ type: 'bigint', nullable: true })
  feesAmount: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'created_at' })
  updatedAt: Date;

  @Column({ name: 'provider_event_time', nullable: true })
  providerEventTime: Date;

  @Column({ name: 'psp', type: 'simple-enum' })
  psp: PSP;

  @ManyToOne(() => Card, (card) => card.transactions)
  card: Card;

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;
}
