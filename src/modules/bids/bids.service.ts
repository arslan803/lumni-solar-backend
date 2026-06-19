import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBidDto } from './bids.dto';
import { calculateBestValue } from '../../common/utils';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async create(installerUserId: string, dto: CreateBidDto) {
    const installer = await this.prisma.installerProfile.findUnique({
      where: { userId: installerUserId },
    });
    if (!installer) throw new NotFoundException('Installer profile not found');
    if (!installer.isVerified) {
      throw new ForbiddenException('Installer not yet verified by admin');
    }

    const request = await this.prisma.customerRequest.findUnique({
      where: { id: dto.requestId },
      include: { bids: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (!['open', 'bidding'].includes(request.status)) {
      throw new BadRequestException('Request is not accepting bids');
    }
    if (new Date() > request.bidDeadline) {
      throw new BadRequestException('Bid deadline has passed');
    }

    const existing = request.bids.find((b) => b.installerId === installer.id);
    if (existing) throw new BadRequestException('You already bid on this request');

    const watts = Number(request.systemSizeKw) * 1000;
    const totalPrice = dto.perWattRate * watts;
    const responseTimeHours =
      (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60);

    const allRates = [...request.bids.map((b) => Number(b.perWattRate)), dto.perWattRate];
    const bestValueScore = calculateBestValue({
      perWattRate: dto.perWattRate,
      allPerWattRates: allRates,
      avgRating: Number(installer.avgRating),
      warrantyYears: dto.warrantyWorkmanshipYr,
      responseTimeHours,
      tier: installer.tier,
    });

    const bid = await this.prisma.bid.create({
      data: {
        requestId: dto.requestId,
        installerId: installer.id,
        perWattRate: dto.perWattRate,
        totalPrice,
        warrantyWorkmanshipYr: dto.warrantyWorkmanshipYr,
        estimatedDays: dto.estimatedDays,
        message: dto.message,
        responseTimeHours,
        bestValueScore,
      },
      include: {
        installer: {
          select: {
            businessName: true,
            tier: true,
            avgRating: true,
          },
        },
      },
    });

    await this.recalculateScores(dto.requestId);
    return bid;
  }

  async recalculateScores(requestId: string) {
    const bids = await this.prisma.bid.findMany({
      where: { requestId, status: 'pending' },
      include: { installer: true },
    });
    const allRates = bids.map((b) => Number(b.perWattRate));

    for (const bid of bids) {
      const score = calculateBestValue({
        perWattRate: Number(bid.perWattRate),
        allPerWattRates: allRates,
        avgRating: Number(bid.installer.avgRating),
        warrantyYears: bid.warrantyWorkmanshipYr,
        responseTimeHours: Number(bid.responseTimeHours),
        tier: bid.installer.tier,
      });
      await this.prisma.bid.update({
        where: { id: bid.id },
        data: { bestValueScore: score },
      });
    }
  }

  async withdraw(bidId: string, installerUserId: string) {
    const installer = await this.prisma.installerProfile.findUnique({
      where: { userId: installerUserId },
    });
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException();
    if (bid.installerId !== installer?.id) throw new ForbiddenException();

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'withdrawn' },
    });
  }
}
