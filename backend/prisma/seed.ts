import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  await prisma.escrowMilestone.deleteMany();
  await prisma.fundRequest.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.escrowConfig.deleteMany();
  await prisma.gasStation.deleteMany();

  console.log('Cleared existing data');

  const config = await prisma.escrowConfig.create({
    data: {
      name: 'default',
      usdcAddress: 'CBIELTK6YBZJU5UP2WWQAUYO4SJ2HBMQEFMU7HHD32YBXE7MKU65XABZ',
      decimals: 7,
      platformFee: 0,
    },
  });
  console.log('Created escrow config:', config.name);

  const jefe = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@transportesnorte.com',
      phone: '+52 55 1234 5678',
      stellarPubKey: 'GBL5PBYAGMRCGRH4GG6HGN3EWLFK555VFHQWUOP72AEDU4DEAYNQDAUI',
      role: 'JEFE',
      status: 'ACTIVE',
    },
  });
  console.log('Created jefe:', jefe.name);

  const drivers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Juan Pérez García',
        email: 'juan.perez@transportesnorte.com',
        phone: '+52 55 2345 6789',
        stellarPubKey: 'GBD5PBYAGMRCGRH4GG6HGN3EWLFK555VFHQWUOP72AEDU4DEAYNQDAUI',
        role: 'CONDUCTOR',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'María García López',
        email: 'maria.garcia@transportesnorte.com',
        phone: '+52 55 3456 7890',
        stellarPubKey: 'GCE5PBYAGMRCGRH4GG6HGN3EWLFK555VFHQWUOP72AEDU4DEAYNQDAUI',
        role: 'CONDUCTOR',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carlos López Martínez',
        email: 'carlos.lopez@transportesnorte.com',
        phone: '+52 55 4567 8901',
        stellarPubKey: 'GDF6PBYAGMRCGRH4GG6HGN3EWLFK555VFHQWUOP72AEDU4DEAYNQDAUI',
        role: 'CONDUCTOR',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ana Martínez Rodríguez',
        email: 'ana.martinez@transportesnorte.com',
        phone: '+52 55 5678 9012',
        stellarPubKey: 'GEG7PBYAGMRCGRH4GG6HGN3EWLFK555VFHQWUOP72AEDU4DEAYNQDAUI',
        role: 'CONDUCTOR',
        status: 'INACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Roberto Sánchez Fernández',
        email: 'roberto.sanchez@transportesnorte.com',
        phone: '+52 55 6789 0123',
        stellarPubKey: 'GFH8PBYAGMRCGRH4GG6HGN3EWLFK555VFHQWUOP72AEDU4DEAYNQDAUI',
        role: 'CONDUCTOR',
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log('Created', drivers.length, 'drivers');

  const units = await Promise.all([
    prisma.unit.create({
      data: {
        make: 'Kenworth',
        model: 'T680',
        year: 2023,
        plates: 'ABC-123-D',
        specs: 'Cummins X15 engine, 500 HP, 300-gal tank',
        permitNumber: 'PERM-2024-12345',
        permitExpiry: new Date('2025-06-15'),
        monthlySpend: 25000,
        status: 'ACTIVE',
        userId: drivers[0].id,
      },
    }),
    prisma.unit.create({
      data: {
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2022,
        plates: 'DEF-456-E',
        specs: 'Detroit DD15 engine, 475 HP, 280-gal tank',
        permitNumber: 'PERM-2024-23456',
        permitExpiry: new Date('2025-08-20'),
        monthlySpend: 32000,
        status: 'ACTIVE',
        userId: drivers[1].id,
      },
    }),
    prisma.unit.create({
      data: {
        make: 'Volvo',
        model: 'VNL 860',
        year: 2024,
        plates: 'GHI-789-F',
        specs: 'Volvo D13 engine, 455 HP, 320-gal tank',
        permitNumber: 'PERM-2024-34567',
        permitExpiry: new Date('2025-12-10'),
        monthlySpend: 28000,
        status: 'ACTIVE',
        userId: drivers[2].id,
      },
    }),
    prisma.unit.create({
      data: {
        make: 'International',
        model: 'LT',
        year: 2021,
        plates: 'JKL-012-G',
        specs: 'Cummins X15 engine, 450 HP, 260-gal tank',
        permitNumber: 'PERM-2024-45678',
        permitExpiry: new Date('2024-03-25'),
        monthlySpend: 18000,
        status: 'INACTIVE',
        userId: drivers[3].id,
      },
    }),
    prisma.unit.create({
      data: {
        make: 'Peterbilt',
        model: '579',
        year: 2023,
        plates: 'MNO-345-H',
        specs: 'PACCAR MX-13 engine, 510 HP, 290-gal tank',
        permitNumber: 'PERM-2024-56789',
        permitExpiry: new Date('2025-09-30'),
        monthlySpend: 35000,
        status: 'ACTIVE',
        userId: drivers[4].id,
      },
    }),
  ]);
  console.log('Created', units.length, 'units');

  const fuelLogs = await Promise.all([
    prisma.fuelLog.create({
      data: {
        date: new Date('2024-03-20T10:32:00'),
        liters: 180,
        pricePerLiter: 25.00,
        amount: 4500,
        fuelType: 'Diesel',
        station: 'Central CDMX Station',
        stationAddress: 'Av. Insurgentes Sur 1234, Del Valle',
        coords: '19.3910,-99.1787',
        unitId: units[0].id,
        userId: drivers[0].id,
      },
    }),
    prisma.fuelLog.create({
      data: {
        date: new Date('2024-03-20T09:15:00'),
        liters: 128,
        pricePerLiter: 25.00,
        amount: 3200,
        fuelType: 'Diesel',
        station: 'Reforma Station',
        stationAddress: 'Paseo de la Reforma 567, Juárez',
        coords: '19.4284,-99.1558',
        unitId: units[1].id,
        userId: drivers[1].id,
      },
    }),
    prisma.fuelLog.create({
      data: {
        date: new Date('2024-03-19T18:45:00'),
        liters: 204,
        pricePerLiter: 25.00,
        amount: 5100,
        fuelType: 'Diesel',
        station: 'North Station',
        stationAddress: 'Blvd. Manuel Ávila Camacho 890',
        coords: '19.4876,-99.2234',
        unitId: units[2].id,
        userId: drivers[2].id,
      },
    }),
    prisma.fuelLog.create({
      data: {
        date: new Date('2024-03-19T15:20:00'),
        liters: 112,
        pricePerLiter: 25.00,
        amount: 2800,
        fuelType: 'Diesel',
        station: 'South Express Station',
        stationAddress: 'Calzada de Tlalpan 2345',
        coords: '19.3012,-99.1456',
        unitId: units[3].id,
        userId: drivers[3].id,
      },
    }),
    prisma.fuelLog.create({
      data: {
        date: new Date('2024-03-19T11:00:00'),
        liters: 168,
        pricePerLiter: 25.00,
        amount: 4200,
        fuelType: 'Diesel',
        station: 'East Station',
        stationAddress: 'Av. Zaragoza 678, Balbuena',
        coords: '19.4123,-99.0987',
        unitId: units[4].id,
        userId: drivers[4].id,
      },
    }),
    prisma.fuelLog.create({
      data: {
        date: new Date('2024-03-18T14:30:00'),
        liters: 195,
        pricePerLiter: 24.50,
        amount: 4777.50,
        fuelType: 'Diesel',
        station: 'Querétaro Central',
        stationAddress: 'Av. Constituyentes 456, Centro',
        coords: '20.5881,-100.3899',
        unitId: units[0].id,
        userId: drivers[0].id,
      },
    }),
  ]);
  console.log('Created', fuelLogs.length, 'fuel logs');

  const fundRequests = await Promise.all([
    prisma.fundRequest.create({
      data: {
        liters: 180,
        amount: 4500,
        description: 'Carga de diésel para ruta CDMX-Guadalajara',
        status: 'RELEASED',
        driverPubKey: drivers[0].stellarPubKey!,
        managerPubKey: jefe.stellarPubKey!,
      },
    }),
    prisma.fundRequest.create({
      data: {
        liters: 128,
        amount: 3200,
        description: 'Carga de diésel para ruta local',
        status: 'APPROVED',
        driverPubKey: drivers[1].stellarPubKey!,
        managerPubKey: jefe.stellarPubKey!,
      },
    }),
    prisma.fundRequest.create({
      data: {
        liters: 204,
        amount: 5100,
        description: 'Carga de diésel para ruta larga',
        status: 'PENDING',
        driverPubKey: drivers[2].stellarPubKey!,
        managerPubKey: jefe.stellarPubKey!,
      },
    }),
    prisma.fundRequest.create({
      data: {
        liters: 150,
        amount: 3750,
        description: 'Carga de diésel semanal',
        status: 'PENDING',
        driverPubKey: drivers[4].stellarPubKey!,
        managerPubKey: jefe.stellarPubKey!,
      },
    }),
  ]);
  console.log('Created', fundRequests.length, 'fund requests');

  const stations = await Promise.all([
    prisma.gasStation.create({
      data: {
        name: 'Central CDMX Station',
        address: 'Av. Insurgentes Sur 1234, Del Valle',
        city: 'Ciudad de México',
        state: 'CDMX',
        lat: 19.3910,
        lng: -99.1787,
        hours: '24 horas',
        services: ['Diesel', 'Magna', 'Premium', 'Aire'],
        status: 'ACTIVE',
      },
    }),
    prisma.gasStation.create({
      data: {
        name: 'Reforma Station',
        address: 'Paseo de la Reforma 567, Juárez',
        city: 'Ciudad de México',
        state: 'CDMX',
        lat: 19.4284,
        lng: -99.1558,
        hours: '06:00 - 22:00',
        services: ['Diesel', 'Magna', 'Premium'],
        status: 'ACTIVE',
      },
    }),
    prisma.gasStation.create({
      data: {
        name: 'North Station',
        address: 'Blvd. Manuel Ávila Camacho 890',
        city: 'Ciudad de México',
        state: 'CDMX',
        lat: 19.4876,
        lng: -99.2234,
        hours: '24 horas',
        services: ['Diesel', 'Magna', 'Lavado'],
        status: 'ACTIVE',
      },
    }),
    prisma.gasStation.create({
      data: {
        name: 'South Express Station',
        address: 'Calzada de Tlalpan 2345',
        city: 'Ciudad de México',
        state: 'CDMX',
        lat: 19.3012,
        lng: -99.1456,
        hours: '05:00 - 23:00',
        services: ['Diesel', 'Magna'],
        status: 'ACTIVE',
      },
    }),
    prisma.gasStation.create({
      data: {
        name: 'East Station',
        address: 'Av. Zaragoza 678, Balbuena',
        city: 'Ciudad de México',
        state: 'CDMX',
        lat: 19.4123,
        lng: -99.0987,
        hours: '24 horas',
        services: ['Diesel', 'Magna', 'Premium', 'Aire', 'Agua'],
        status: 'ACTIVE',
      },
    }),
    prisma.gasStation.create({
      data: {
        name: 'Querétaro Central',
        address: 'Av. Constituyentes 456, Centro',
        city: 'Querétaro',
        state: 'Querétaro',
        lat: 20.5881,
        lng: -100.3899,
        hours: '24 horas',
        services: ['Diesel', 'Magna', 'Premium'],
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log('Created', stations.length, 'gas stations');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
