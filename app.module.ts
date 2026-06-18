import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PackagesModule } from './modules/packages/packages.module';
import { RequestsModule } from './modules/requests/requests.module';
import { BidsModule } from './modules/bids/bids.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { InstallersModule } from './modules/installers/installers.module';
import { JazzcashModule } from './modules/jazzcash/jazzcash.module';
import { AdminModule } from './modules/admin/admin.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    RequestsModule,
    BidsModule,
    BookingsModule,
    InstallersModule,
    JazzcashModule,
    AdminModule,
    RatingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
