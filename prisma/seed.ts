import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin ────────────────────────────────────────────────────────────────────
  const adminPhone = '03340008861';
  const adminHash = await bcrypt.hash('12345', 10);
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { passwordHash: adminHash, name: 'Admin', role: 'admin' },
    create: {
      phone: adminPhone,
      name: 'Admin',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log('✅ Admin:', admin.phone);

  // ── Demo customer ─────────────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { phone: '03001000002' },
    update: {},
    create: {
      phone: '03001000002',
      name: 'Ahmed Khan',
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
  console.log('✅ Customer:', customer.phone);

  // ── Demo installer ────────────────────────────────────────────────────────────
  const installerHash = await bcrypt.hash('installer123', 10);
  const installer = await prisma.user.upsert({
    where: { phone: '03001000003' },
    update: {},
    create: {
      phone: '03001000003',
      name: 'SolarPro Lahore',
      passwordHash: installerHash,
      role: 'installer',
      installerProfile: {
        create: {
          businessName: 'SolarPro Lahore',
          fullName: 'Ali Raza',
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
  console.log('✅ Installer:', installer.phone);

  // ── Solar packages ────────────────────────────────────────────────────────────
  const packages = [
    {
      id: 'pkg-5kw-lahore',
      name: '5kW Home Standard',
      systemSizeKw: 5,
      panelCount: 12,
      panelModel: 'Longi 420W Mono PERC',
      inverterModel: 'Huawei 5kW String Inverter',
      description: 'Ideal for small homes in Lahore. Net metering ready with LESCO.',
      priceMinPkr: 750000,
      priceMaxPkr: 950000,
    },
    {
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
    {
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
  ];

  for (const pkg of packages) {
    await prisma.solarPackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
    console.log('✅ Package:', pkg.name);
  }

  console.log('\n🎉 Seed complete!');
  console.log('Admin login    → phone: 03340008861  password: 12345');
  console.log('Customer demo  → phone: 03001000002  password: customer123');
  console.log('Installer demo → phone: 03001000003  password: installer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
