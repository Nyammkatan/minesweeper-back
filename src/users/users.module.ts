import { Module } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService, FileService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}