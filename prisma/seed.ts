import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);
  const installerHash = await bcrypt.hash('installer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumni.pk' },
    update: {},
    create: {
      email: 'admin@lumni.pk',
      phone: '+923001000001',
      passwordHash,
      role: 'admin',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@lumni.pk' },
    update: {},
    create: {
      email: 'customer@lumni.pk',
      phone: '+923001000002',
      passwordHash: customerHash,
      role: 'customer',
      customerProfile: {
        create: {
          fullName: 'Ahmed Khan',
          address: 'DHA Phase 5, Lahore',
          latitude: 31.4697,
          longitude: 74.4104,
        },
      },
    },
  });

  const installerUser = await prisma.user.upsert({
    where: { email: 'installer@lumni.pk' },
    update: {},
    create: {
      email: 'installer@lumni.pk',
      phone: '+923001000003',
      passwordHash: installerHash,
      role: 'installer',
      installerProfile: {
        create: {
          businessName: 'SolarPro Lahore',
          licenseNumber: 'AEDB-LHR-2024-001',
          tier: 'gold',
          tierVerifiedAt: new Date(),
          perWattBaseRate: 17.5,
          serviceRadiusKm: 40,
          latitude: 31.5497,
          longitude: 74.3436,
          addressText: 'Gulberg III, Lahore',
          isAvailable: true,
          isVerified: true,
          totalJobs: 45,
          avgRating: 4.7,
          responseTimeAvgH: 2.5,
          jazzcashAccount: '03001234567',
        },
      },
    },
  });

  const pkg5kw = await prisma.solarPackage.upsert({
    where: { id: 'pkg-5kw-lahore' },
    update: {},
    create: {
      id: 'pkg-5kw-lahore',
      name: '5kW Home Standard',
      systemSizeKw: 5,
      panelCount: 12,
      panelModel: 'Longi 420W Mono PERC',
      inverterModel: 'Huawei 5kW String Inverter',
      description: 'Ideal for small homes in Lahore. Net metering ready with IESCO.',
      priceMinPkr: 750000,
      priceMaxPkr: 950000,
    },
  });

  const pkg10kw = await prisma.solarPackage.upsert({
    where: { id: 'pkg-10kw-lahore' },
    update: {},
    create: {
      id: 'pkg-10kw-lahore',
      name: '10kW Home Plus',
      systemSizeKw: 10,
      panelCount: 24,
      panelModel: 'Jinko 420W Mono PERC',
      inverterModel: 'Sungrow 10kW String Inverter',
      description: 'Medium home solution with backup-ready inverter option.',
      priceMinPkr: 1400000,
      priceMaxPkr: 1800000,
    },
  });

  const pkg5kwHybrid = await prisma.solarPackage.upsert({
    where: { id: 'pkg-5kw-hybrid-lahore' },
    update: {},
    create: {
      id: 'pkg-5kw-hybrid-lahore',
      name: '5kW + Battery Ready',
      systemSizeKw: 5,
      panelCount: 12,
      panelModel: 'Canadian Solar 420W',
      inverterModel: 'GoodWe 5kW Hybrid Inverter',
      batteryModel: 'Pylontech 10kWh (optional)',
      description: 'Hybrid system for load shedding backup in Lahore.',
      priceMinPkr: 1100000,
      priceMaxPkr: 1400000,
    },
  });

  console.log('Seed complete:', {
    admin: admin.email,
    customer: customer.email,
    installer: installerUser.email,
    packages: [pkg5kw.name, pkg10kw.name, pkg5kwHybrid.name],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
