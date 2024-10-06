import { Module } from '@nestjs/common';
import EventValidator from './event-validator.validator';

@Module({ providers: [EventValidator], exports: [EventValidator] })
export default class ValidatorModule {}
