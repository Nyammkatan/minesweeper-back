import { Module } from '@nestjs/common';
import { GridModule } from './grid/grid.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FileService } from './file/file.service';

@Module({
  imports: [GridModule, AuthModule, UsersModule],
  providers: [FileService],
})
export class AppModule {}
