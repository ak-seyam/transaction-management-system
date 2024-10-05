import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import TransactionStatus from './transaction-status';

@Entity()
export default class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  currency: string;

  @Column({ name: 'fractional_digits' })
  fractionalDigits: number;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'enum' })
  status: TransactionStatus;

  @Column({ name: 'fees_currency', nullable: true })
  feesCurrency: string;

  @Column({ name: 'fractional_digits', nullable: true })
  feesFractionalDigits: number;

  @Column({ type: 'bigint', nullable: true })
  feesAmount: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'created_at' })
  updatedAt: Date;

  @Column({ name: 'provider_event_time', nullable: true })
  providerEventTime: Date;
}
