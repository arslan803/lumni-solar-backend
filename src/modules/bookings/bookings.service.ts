import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findByCustomer(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      include: {
        request: true,
        bid: true,
        installer: { select: { businessName: true, tier: true, avgRating: true } },
        milestones: true,
        installationRecord: true,
        rating: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        request: true,
        bid: true,
        installer: true,
        milestones: true,
        installationRecord: true,
      },
    });
    if (!booking) throw new NotFoundException();
    if (role === 'customer' && booking.customerId !== userId) {
      throw new ForbiddenException();
    }
    if (role === 'installer') {
      const installer = await this.prisma.installerProfile.findUnique({
        where: { userId },
      });
      if (installer?.id !== booking.installerId) throw new ForbiddenException();
    }
    return booking;
  }

  async confirmMilestone(bookingId: string, milestoneId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { milestones: true },
    });
    if (!booking) throw new NotFoundException();
    if (booking.customerId !== userId) throw new ForbiddenException();

    const milestone = booking.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== 'held') {
      throw new ForbiddenException('Milestone not in held state');
    }

    await this.prisma.paymentMilestone.update({
      where: { id: milestoneId },
      data: { status: 'released', releasedAt: new Date() },
    });

    const allMilestones = await this.prisma.paymentMilestone.findMany({
      where: { bookingId },
    });
    const allReleased = allMilestones.every(
      (m) => m.id === milestoneId || m.status === 'released',
    );

    if (allReleased) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'completed', completedAt: new Date() },
      });
      await this.prisma.customerRequest.update({
        where: { id: booking.requestId },
        data: { status: 'completed' },
      });
    }

    return this.findOne(bookingId, userId, 'customer');
  }

  async createInstallationRecord(
    bookingId: string,
    installerUserId: string,
    data: {
      panelSerials: string[];
      inverterSerial: string;
      designDocUrl?: string;
    },
  ) {
    const installer = await this.prisma.installerProfile.findUnique({
      where: { userId: installerUserId },
    });
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { request: true },
    });
    if (!booking) throw new NotFoundException();
    if (booking.installerId !== installer?.id) throw new ForbiddenException();

    const warrantyStart = new Date();
    const warrantyEnd = new Date();
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 5);

    return this.prisma.installationRecord.upsert({
      where: { bookingId },
      create: {
        bookingId,
        systemSizeKw: booking.request.systemSizeKw,
        panelSerials: data.panelSerials,
        inverterSerial: data.inverterSerial,
        designDocUrl: data.designDocUrl,
        warrantyStart,
        warrantyEnd,
      },
      update: {
        panelSerials: data.panelSerials,
        inverterSerial: data.inverterSerial,
        designDocUrl: data.designDocUrl,
      },
    });
  }
}
