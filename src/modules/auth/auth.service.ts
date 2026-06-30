import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check unique phone
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Mobile number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        passwordHash,
        role: dto.role,
        ...(dto.role === 'customer'
          ? {
              customerProfile: {
                create: { fullName: dto.name },
              },
            }
          : {}),
        ...(dto.role === 'installer'
          ? {
              installerProfile: {
                create: {
                  businessName: dto.businessName || dto.name,
                  fullName: dto.name,
                  latitude: 31.5204,
                  longitude: 74.3587,
                  addressText: 'Lahore, Pakistan',
                },
              },
            }
          : {}),
      },
      include: { customerProfile: true, installerProfile: true },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { customerProfile: true, installerProfile: true },
    });
    if (!user) throw new UnauthorizedException('Invalid mobile number or password');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid mobile number or password');

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: any) {
    const token = this.jwt.sign({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken: token };
  }
}
