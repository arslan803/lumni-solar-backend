import { Module } from '@nestjs/common';
import { InstallersController } from './installers.controller';
import { InstallersService } from './installers.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [InstallersController],
  providers: [InstallersService],
  exports: [InstallersService],
})
export class InstallersModule {}
