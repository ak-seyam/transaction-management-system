import { Injectable, Logger } from '@nestjs/common';
import UserDetails from 'src/user/user-details';

@Injectable()
export class NotificationService {
  async sendNotification(
    userDetails: UserDetails,
    message: string,
  ): Promise<boolean> {
    // Assume that it will always work
    Logger.debug(`sending message ${message} to ${userDetails.phoneNumber}`);
    return true;
  }
}
