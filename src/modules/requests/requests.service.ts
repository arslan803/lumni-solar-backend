import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequestDto } from './requests.dto';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, dto: CreateRequestDto) {
    const hours = dto.bidDeadlineHours || 48;
    const now = new Date();
    const bidDeadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.customerRequest.create({
      data: {
        customerId,
        packageId: dto.packageId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        systemSizeKw: dto.systemSizeKw || dto.sanctionedLoadKw,
        systemType: dto.systemType as any,
        structureType: dto.structureType as any,
        totalAreaMarla: dto.totalAreaMarla,
        buildingHeightFt: dto.buildingHeightFt,
        propertyType: dto.propertyType as any,
        transformerCapacity: dto.propertyType === 'industrial' ? dto.transformerCapacity : null,
        ownershipStatus: dto.ownershipStatus as any,
        sanctionedLoadKw: dto.sanctionedLoadKw,
        roofType: dto.roofType,
        shadingOnRoof: dto.shadingOnRoof as any,
        electricityProvider: dto.electricityProvider as any,
        currentElectricityBill: dto.currentElectricityBill,
        interestReason: dto.interestReason as any,
        installationTimeline: dto.installationTimeline as any,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        city: 'Lahore',
        notes: dto.notes,
        budgetMax: dto.budgetMax,
        status: 'bidding',
        bidDeadline,
        expiresAt,
      },
      include: { package: true },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.customerRequest.findMany({
      where: { customerId },
      include: {
        package: true,
        bids: {
          include: {
            installer: {
              select: {
                id: true,
                businessName: true,
                tier: true,
                avgRating: true,
                totalJobs: true,
              },
            },
          },
          orderBy: { bestValueScore: 'desc' },
        },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const request = await this.prisma.customerRequest.findUnique({
      where: { id },
      include: {
        package: true,
        bids: {
          include: {
            installer: {
              select: {
                id: true,
                businessName: true,
                tier: true,
                avgRating: true,
                totalJobs: true,
                responseTimeAvgH: true,
              },
            },
          },
          orderBy: { bestValueScore: 'desc' },
        },
        booking: { include: { milestones: true } },
      },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (role === 'customer' && request.customerId !== userId) {
      throw new ForbiddenException();
    }
    return request;
  }

  async selectBid(requestId: string, customerId: string, bidId: string) {
    const request = await this.prisma.customerRequest.findUnique({
      where: { id: requestId },
      include: { bids: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.customerId !== customerId) throw new ForbiddenException();
    if (!['open', 'bidding'].includes(request.status)) {
      throw new BadRequestException('Request is not open for selection');
    }

    const bid = request.bids.find((b) => b.id === bidId);
    if (!bid) throw new NotFoundException('Bid not found');

    const commissionPct = Number(process.env.PLATFORM_COMMISSION_PCT || 6);
    const totalAmount = Number(bid.totalPrice);
    const platformCommission = (totalAmount * commissionPct) / 100;
    const installerPayout = totalAmount - platformCommission;

    const [updatedRequest, , , booking] = await this.prisma.$transaction([
      this.prisma.customerRequest.update({
        where: { id: requestId },
        data: { status: 'selected', selectedBidId: bidId },
      }),
      this.prisma.bid.update({
        where: { id: bidId },
        data: { status: 'accepted' },
      }),
      this.prisma.bid.updateMany({
        where: { requestId, id: { not: bidId } },
        data: { status: 'rejected' },
      }),
      this.prisma.booking.create({
        data: {
          requestId,
          bidId,
          customerId,
          installerId: bid.installerId,
          totalAmount,
          platformCommission,
          installerPayout,
          status: 'pending_deposit',
          milestones: {
            create: [
              { name: 'Deposit', percentage: 30, amount: totalAmount * 0.3 },
              { name: 'Panel Mount', percentage: 40, amount: totalAmount * 0.4 },
              { name: 'Completion', percentage: 30, amount: totalAmount * 0.3 },
            ],
          },
        },
        include: { milestones: true },
      }),
    ]);

    return { request: updatedRequest, booking };
  }
}
