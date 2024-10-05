import { Injectable } from '@nestjs/common';
import UserDetails from './user-details';

@Injectable()
export class UserService {
  async getUserDetails(userId: string): Promise<UserDetails> {
    // TODO: for testing it should call profile serivce for details
    return {
      email: 'randon.email@email.com',
      locale: 'Africa/Cairo',
      phoneNumber: '+201111111111',
      userId: userId,
    };
  }
}
