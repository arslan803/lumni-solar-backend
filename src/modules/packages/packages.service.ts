import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.solarPackage.findMany({
      where: { isActive: true },
      orderBy: { systemSizeKw: 'asc' },
    });
  }
}
