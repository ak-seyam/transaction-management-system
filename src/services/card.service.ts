import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Card from '../entities/card.entitiy';
import { v4 as randomUUIDV4 } from 'uuid';

@Injectable()
export class CardService {
  constructor(@InjectRepository(Card) private cardRepo: Repository<Card>) {}

  async getCardByCardToken(token: string) {
    const card = this.findCardByReference(token);
    if (card) {
      return card;
    }
    // Note: in normal case I should throw an expection but for simplicity I will provision a new card automatically
    // with random user id
    const newCard = this.provisionNewCard(token);
    return newCard;
  }

  async findCardByReference(cardToken: string) {
    return await this.cardRepo.findOne({
      where: {
        cardToken: cardToken,
      },
    });
  }

  async provisionNewCard(token: string) {
    const card = new Card();
    card.cardToken = token;
    card.userId = randomUUIDV4();
    return await this.cardRepo.save(card);
  }
}
