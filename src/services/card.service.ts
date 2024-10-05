import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Card from '../entities/card.entitiy';
import { v4 as randomUUIDV4 } from 'uuid';
import { CardDetails, CardSchema } from 'src/common/proto/service';

@Injectable()
export class CardService {
  constructor(@InjectRepository(Card) private cardRepo: Repository<Card>) {}

  async getCardByCardToken(token: string) {
    const card = this.findCardByCardToken(token);
    if (card) {
      return card;
    }
    // Note: in normal case I should throw an expection but for simplicity I will provision a new card automatically
    // with random user id
    const newCard = this.provisionNewCard(token);
    return newCard;
  }

  async findCardByCardToken(cardToken: string) {
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

  async getCardDetails(token: string): Promise<CardDetails> {
    Logger.debug(`getting card details for token ${token}`);
    return {
      cardSchewma: CardSchema.VISA,
      censoredCardNumber: '1234******342423',
    };
  }
}
