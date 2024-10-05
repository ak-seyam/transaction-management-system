type MoneyStructure = {
  amount: number;
  fractionalDigits: number;
  currency: string;
};

export default class Money {
  readonly amountInBaseCurrency: number;
  readonly fractionalDigits: number;
  readonly currency: string;

  constructor(moneyStructure: MoneyStructure) {
    this.amountInBaseCurrency = moneyStructure.amount;
    this.fractionalDigits = moneyStructure.fractionalDigits;
    this.currency = moneyStructure.currency;
  }

  add(addressedMoney: Money): Money {
    return this.modifyMoney(
      addressedMoney,
      this.amountInBaseCurrency + addressedMoney.amountInBaseCurrency,
    );
  }

  subtract(addressedMoney: Money): Money {
    return this.modifyMoney(
      addressedMoney,
      this.amountInBaseCurrency - addressedMoney.amountInBaseCurrency,
    );
  }

  private modifyMoney(addressedMoney: Money, newAmount: number) {
    if (addressedMoney.currency != this.currency) {
      throw new Error('Different currencies addition is not implemented'); // TODO use domain speicif error instead of generic error
    }
    if (addressedMoney.fractionalDigits != this.fractionalDigits) {
      throw new Error(
        'Different fractional digits addition is not implemented',
      ); // TODO use domain speicif error instead of generic error
    }
    return new Money({
      amount: newAmount,
      currency: this.currency,
      fractionalDigits: this.fractionalDigits,
    });
  }
}
