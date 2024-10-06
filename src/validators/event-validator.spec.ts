import EventValidator from '@validators/event-validator.validator';
import {
  MessaageType,
  Provider,
  TransactionEvent,
} from '@common/proto/service';

describe('EventValidator test suite', () => {
  const validator: EventValidator = new EventValidator();
  describe('validate transaction events', () => {
    it('should result correct amount all values are present', () => {
      const event: TransactionEvent = {
        amount: 100_000,
        cardToken: '234293048',
        currency: 'AED',
        eventId: '2313u1io23ui1o2u',
        feesAmount: 0,
        feesCurrency: 'AED',
        feesFractionalDigits: 2,
        fractionalDigits: 2,
        provider: Provider.PSP1,
        providerEventTime: new Date(),
        reference: 'ref213124',
        type: MessaageType.AUTHORIZATION,
      };
      expect(() => validator.validateEvent(event)).not.toThrow();
    });
    it('should result invalid amount amount is not positive', () => {
      const event: TransactionEvent = {
        amount: 0,
        cardToken: '234293048',
        currency: 'AED',
        eventId: '2313u1io23ui1o2u',
        feesAmount: 0,
        feesCurrency: 'AED',
        feesFractionalDigits: 2,
        fractionalDigits: 2,
        provider: Provider.PSP1,
        providerEventTime: new Date(),
        reference: 'ref213124',
        type: MessaageType.AUTHORIZATION,
      };
      expect(() => validator.validateEvent(event)).toThrow();
    });
    it('should result invalid amount fees are negative', () => {
      const event: TransactionEvent = {
        amount: 0,
        cardToken: '234293048',
        currency: 'AED',
        eventId: '2313u1io23ui1o2u',
        feesAmount: -1,
        feesCurrency: 'AED',
        feesFractionalDigits: 2,
        fractionalDigits: 2,
        provider: Provider.PSP1,
        providerEventTime: new Date(),
        reference: 'ref213124',
        type: MessaageType.AUTHORIZATION,
      };
      expect(() => validator.validateEvent(event)).toThrow();
    });
    it('should result invalid currency is null', () => {
      const event: TransactionEvent = {
        amount: 0,
        cardToken: '234293048',
        currency: null,
        eventId: '2313u1io23ui1o2u',
        feesAmount: -1,
        feesCurrency: 'AED',
        feesFractionalDigits: 2,
        fractionalDigits: 2,
        provider: Provider.PSP1,
        providerEventTime: new Date(),
        reference: 'ref213124',
        type: MessaageType.AUTHORIZATION,
      };
      expect(() => validator.validateEvent(event)).toThrow();
    });
  });
});
