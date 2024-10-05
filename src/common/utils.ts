import PSP from 'src/entities/transaction-psp';
import { Provider } from './proto/service';

export function mapProvider(provider: Provider): PSP {
  switch (provider) {
    case Provider.PSP1:
      return PSP.PSP1;
    case Provider.PSP2:
      return PSP.PSP2;
    default:
      throw new Error('Unable to map provider'); // TODO replace with domain specific error
  }
}
