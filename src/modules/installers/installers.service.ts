import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { haversineDistanceKm } from '../../common/utils';
import { encryptCnic, maskCnic } from '../../common/cnic-crypto';

const GALLERY_MAX = 10;

const PRIVATE_FIELDS = [
  'cnicNumber',
  'phonePrivate',
  'whatsappNumber',
  'companyName',
  'fullAddress',
] as const;

function stripPrivate(profile: any) {
  if (!profile) return profile;
  const copy = { ...profile };
  for (const f of PRIVATE_FIELDS) delete copy[f];
  if (profile.cnicVerified && profile.cnicNumber) {
    copy.cnicMasked = maskCnic(profile.cnicNumber);
  }
  return copy;
}

@Injectable()
export class InstallersService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.installerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, phone: true } },
        gallery: { orderBy: { createdAt: 'asc' } },
        ratings: {
          select: { score: true, comment: true, createdAt: true, reviewer: { select: { customerProfile: { select: { fullName: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!profile) throw new NotFoundException('Installer profile not found');
    const result: any = { ...profile };
    if (profile.cnicNumber) {
      result.cnicMasked = maskCnic(profile.cnicNumber);
    }
    return result;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.installerProfile.update({
      where: { userId },
      data,
    });
  }

  async updateCnic(userId: string, rawCnic: string) {
    if (!/^\d{5}-\d{7}-\d$/.test(rawCnic)) {
      throw new BadRequestException('Invalid CNIC format (expected XXXXX-XXXXXXX-X)');
    }
    const encrypted = encryptCnic(rawCnic);
    return this.prisma.installerProfile.update({
      where: { userId },
      data: { cnicNumber: encrypted, cnicVerified: false },
      select: { cnicVerified: true },
    });
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    this.cloudinary.validateFile(file);
    const profile = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    if (profile.profilePhotoUrl) {
      await this.cloudinary.deleteByUrl(profile.profilePhotoUrl);
    }
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'lumni/profile-photos');
    await this.prisma.installerProfile.update({ where: { userId }, data: { profilePhotoUrl: url } });
    return { profilePhotoUrl: url };
  }

  async uploadCertificate(userId: string, file: Express.Multer.File) {
    this.cloudinary.validateFile(file);
    const profile = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    if (profile.trainingCertificateUrl) {
      await this.cloudinary.deleteByUrl(profile.trainingCertificateUrl);
    }
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'lumni/certificates');
    await this.prisma.installerProfile.update({ where: { userId }, data: { trainingCertificateUrl: url } });
    return { trainingCertificateUrl: url };
  }

  async getGallery(userId: string) {
    const profile = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    return this.prisma.installerGallery.findMany({
      where: { installerProfileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addGalleryPhoto(userId: string, file: Express.Multer.File, caption?: string) {
    this.cloudinary.validateFile(file);
    const profile = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    const count = await this.prisma.installerGallery.count({ where: { installerProfileId: profile.id } });
    if (count >= GALLERY_MAX) {
      throw new BadRequestException(`Maximum ${GALLERY_MAX} gallery photos allowed`);
    }
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'lumni/gallery');
    return this.prisma.installerGallery.create({
      data: { installerProfileId: profile.id, photoUrl: url, caption: caption || null },
    });
  }

  async deleteGalleryPhoto(userId: string, galleryId: string) {
    const profile = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    const photo = await this.prisma.installerGallery.findFirst({
      where: { id: galleryId, installerProfileId: profile.id },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.cloudinary.deleteByUrl(photo.photoUrl);
    await this.prisma.installerGallery.delete({ where: { id: galleryId } });
    return { deleted: true };
  }

  async getPublicProfile(profileId: string, requesterRole?: string) {
    const profile = await this.prisma.installerProfile.findUnique({
      where: { id: profileId },
      include: {
        gallery: { orderBy: { createdAt: 'asc' } },
        ratings: {
          select: {
            score: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { customerProfile: { select: { fullName: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!profile) throw new NotFoundException('Installer not found');
    // Admins see all private fields; customers/installers get them stripped
    if (requesterRole === 'admin') {
      const copy: any = { ...profile };
      if (profile.cnicVerified && profile.cnicNumber) {
        copy.cnicMasked = maskCnic(profile.cnicNumber);
      }
      return copy;
    }
    return stripPrivate(profile);
  }

  async getNearbyRequests(userId: string) {
    const installer = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!installer) throw new NotFoundException();
    if (!installer.latitude || !installer.longitude) {
      throw new ForbiddenException('Set your service location first');
    }
    const requests = await this.prisma.customerRequest.findMany({
      where: { status: { in: ['open', 'bidding'] }, city: 'Lahore', bidDeadline: { gt: new Date() } },
      include: { package: true, bids: { where: { installerId: installer.id } } },
      orderBy: { createdAt: 'desc' },
    });
    return requests
      .map((req) => ({
        ...req,
        distanceKm: haversineDistanceKm(installer.latitude!, installer.longitude!, req.latitude, req.longitude),
        hasBid: req.bids.length > 0,
      }))
      .filter((req) => req.distanceKm <= installer.serviceRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getActiveJobs(userId: string) {
    const installer = await this.prisma.installerProfile.findUnique({ where: { userId } });
    if (!installer) throw new NotFoundException();
    return this.prisma.booking.findMany({
      where: { installerId: installer.id, status: { notIn: ['completed', 'cancelled'] } },
      include: { request: true, bid: true, milestones: true, installationRecord: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
