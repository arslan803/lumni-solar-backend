import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { haversineDistanceKm } from '../../common/utils';

@Injectable()
export class InstallersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.installerProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!profile) throw new NotFoundException('Installer profile not found');
    return profile;
  }

  async updateProfile(userId: string, data: Partial<{
    perWattBaseRate: number;
    serviceRadiusKm: number;
    isAvailable: boolean;
    jazzcashAccount: string;
    latitude: number;
    longitude: number;
    addressText: string;
  }>) {
    return this.prisma.installerProfile.update({
      where: { userId },
      data,
    });
  }

  async getNearbyRequests(userId: string) {
    const installer = await this.prisma.installerProfile.findUnique({
      where: { userId },
    });
    if (!installer) throw new NotFoundException();
    if (!installer.latitude || !installer.longitude) {
      throw new ForbiddenException('Set your service location first');
    }

    const requests = await this.prisma.customerRequest.findMany({
      where: {
        status: { in: ['open', 'bidding'] },
        city: 'Lahore',
        bidDeadline: { gt: new Date() },
      },
      include: {
        package: true,
        bids: { where: { installerId: installer.id } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests
      .map((req) => ({
        ...req,
        distanceKm: haversineDistanceKm(
          installer.latitude!,
          installer.longitude!,
          req.latitude,
          req.longitude,
        ),
        hasBid: req.bids.length > 0,
      }))
      .filter((req) => req.distanceKm <= installer.serviceRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getActiveJobs(userId: string) {
    const installer = await this.prisma.installerProfile.findUnique({
      where: { userId },
    });
    if (!installer) throw new NotFoundException();

    return this.prisma.booking.findMany({
      where: {
        installerId: installer.id,
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        request: true,
        bid: true,
        milestones: true,
        installationRecord: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
