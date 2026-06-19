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
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        ...(dto.role === 'customer' && dto.fullName
          ? {
              customerProfile: {
                create: { fullName: dto.fullName },
              },
            }
          : {}),
        ...(dto.role === 'installer' && dto.businessName
          ? {
              installerProfile: {
                create: {
                  businessName: dto.businessName,
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
      where: { email: dto.email },
      include: { customerProfile: true, installerProfile: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: any) {
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken: token };
  }
}
