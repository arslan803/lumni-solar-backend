import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(bookingId: string, reviewerId: string, score: number, comment?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException();
    if (booking.customerId !== reviewerId) throw new ForbiddenException();
    if (booking.status !== 'completed') {
      throw new ForbiddenException('Can only rate completed bookings');
    }

    const rating = await this.prisma.rating.create({
      data: {
        bookingId,
        reviewerId,
        installerId: booking.installerId,
        score,
        comment,
      },
    });

    const agg = await this.prisma.rating.aggregate({
      where: { installerId: booking.installerId },
      _avg: { score: true },
      _count: true,
    });

    await this.prisma.installerProfile.update({
      where: { id: booking.installerId },
      data: {
        avgRating: agg._avg.score || 0,
        totalJobs: agg._count,
      },
    });

    return rating;
  }
}
