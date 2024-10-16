import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const TypeOrmConfig: TypeOrmModuleOptions = {
  host: process.env['DB_HOST'],
  port: parseInt(process.env['DB_PORT']) || 5432,
  username: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],
  type: 'postgres',
  autoLoadEntities: true,
  logging: true,
};

export default TypeOrmConfig;
