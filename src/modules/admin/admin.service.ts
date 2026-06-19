import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstallerTier } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingInstallers() {
    return this.prisma.installerProfile.findMany({
      where: { isVerified: false },
      include: { user: { select: { email: true, phone: true, createdAt: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyInstaller(installerId: string, tier: InstallerTier) {
    return this.prisma.installerProfile.update({
      where: { id: installerId },
      data: {
        isVerified: true,
        tier,
        tierVerifiedAt: new Date(),
      },
    });
  }

  async getMetrics() {
    const [requests, bookings, installers, bids] = await Promise.all([
      this.prisma.customerRequest.count(),
      this.prisma.booking.count(),
      this.prisma.installerProfile.count({ where: { isVerified: true } }),
      this.prisma.bid.count(),
    ]);

    const completedBookings = await this.prisma.booking.findMany({
      where: { status: 'completed' },
      select: { totalAmount: true },
    });
    const gmv = completedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    return {
      totalRequests: requests,
      totalBookings: bookings,
      verifiedInstallers: installers,
      totalBids: bids,
      gmvCompletedPkr: gmv,
      pilotCity: 'Lahore',
    };
  }

  async getAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        request: { select: { address: true, systemSizeKw: true } },
        installer: { select: { businessName: true, tier: true } },
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
