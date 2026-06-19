import { Module } from '@nestjs/common';
import { JazzcashController } from './jazzcash.controller';
import { JazzcashService } from './jazzcash.service';

@Module({
  controllers: [JazzcashController],
  providers: [JazzcashService],
  exports: [JazzcashService],
})
export class JazzcashModule {}
