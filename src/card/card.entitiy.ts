import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cards' })
export default class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_token' })
  cardToken: string;

  @Column({ name: 'user_id' })
  userId: string;
}
