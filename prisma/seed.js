const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;

async function main() {
  console.log('Starting database seed...');

  // Clean existing data (child tables first)
  await prisma.report.deleteMany({});
  await prisma.claim.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // 1. Admin
  await prisma.user.create({
    data: {
      email: 'admin@foodsurplus.org',
      passwordHash: adminPassword,
      name: 'Demo Admin',
      role: 'ADMIN',
      status: 'APPROVED',
      phone: '+91 90000 00001',
      organizationName: 'Food Surplus Connector HQ',
      organizationType: 'OTHER',
      address: 'Demo Building 1, Main Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
  });

  // 2. Donors
  const donor1 = await prisma.user.create({
    data: {
      email: 'demo.hotel@donor.com',
      passwordHash: defaultPassword,
      name: 'Demo Donor One',
      role: 'DONOR',
      status: 'APPROVED',
      phone: '+91 90000 00011',
      organizationName: 'Demo Hotel & Banquet',
      organizationType: 'FUNCTION_HALL',
      address: 'Demo Building 2, Residency Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
    },
  });

  const donor2 = await prisma.user.create({
    data: {
      email: 'demo.restaurant@donor.com',
      passwordHash: defaultPassword,
      name: 'Demo Donor Two',
      role: 'DONOR',
      status: 'APPROVED',
      phone: '+91 90000 00012',
      organizationName: 'Demo Restaurant & Catering',
      organizationType: 'RESTAURANT',
      address: 'Demo Building 3, 100ft Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
    },
  });

  const donor3 = await prisma.user.create({
    data: {
      email: 'demo.hostel@donor.com',
      passwordHash: defaultPassword,
      name: 'Demo Donor Three',
      role: 'DONOR',
      status: 'APPROVED',
      phone: '+91 90000 00013',
      organizationName: 'Demo University Hostel Mess',
      organizationType: 'HOSTEL',
      address: 'Demo Campus Gate 3, Electronic City',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
    },
  });

  // 3. Receivers (NGOs / Volunteers)
  const receiver1 = await prisma.user.create({
    data: {
      email: 'demo.ngo1@ngo.com',
      passwordHash: defaultPassword,
      name: 'Demo Receiver One',
      role: 'RECEIVER',
      status: 'APPROVED',
      phone: '+91 90000 00021',
      organizationName: 'Demo Helping Hands NGO',
      organizationType: 'NGO',
      documentUrl: 'https://example.com/docs/demo-ngo-1.pdf',
      address: 'Demo Building 4, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
    },
  });

  await prisma.user.create({
    data: {
      email: 'demo.ngo2@ngo.com',
      passwordHash: defaultPassword,
      name: 'Demo Receiver Two',
      role: 'RECEIVER',
      status: 'APPROVED',
      phone: '+91 90000 00022',
      organizationName: 'Demo Hope Kitchen NGO',
      organizationType: 'NGO',
      documentUrl: 'https://example.com/docs/demo-ngo-2.pdf',
      address: 'Demo Building 5, BTM 2nd Stage',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560076',
    },
  });

  // Receiver with PENDING status, to test the admin approval feature
  await prisma.user.create({
    data: {
      email: 'demo.volunteer@ngo.com',
      passwordHash: defaultPassword,
      name: 'Demo Receiver Three',
      role: 'RECEIVER',
      status: 'PENDING',
      phone: '+91 90000 00023',
      organizationName: 'Demo Youth Volunteers',
      organizationType: 'VOLUNTEER',
      documentUrl: 'https://example.com/docs/demo-volunteer.pdf',
      address: 'Demo Building 6, Malleshwaram',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560003',
    },
  });

  // 4. Donations
  const now = new Date();
  const cookedImage =
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80';

  // Donation 1: cooked meals, available
  await prisma.donation.create({
    data: {
      donorId: donor1.id,
      title: 'Buffet Surplus: Paneer Butter Masala, Jeera Rice & Naan',
      description:
        'Freshly cooked buffet surplus. Packed in clean food-grade containers, untouched and sealed.',
      category: 'COOKED_MEALS',
      quantity: 75,
      quantityUnit: 'servings',
      preparationTime: new Date(now.getTime() - 1 * HOUR),
      pickupDeadline: new Date(now.getTime() + 4 * HOUR),
      foodCondition: 'FRESH_HOT',
      address: 'Demo Hotel & Banquet, Service Gate 2, Residency Road',
      area: 'Residency Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      imageUrl: cookedImage,
      status: 'AVAILABLE',
    },
  });

  // Donation 2: produce, available
  await prisma.donation.create({
    data: {
      donorId: donor1.id,
      title: 'Fresh Vegetables: Bell Peppers, Tomatoes & Potatoes',
      description:
        'Good quality vegetables from kitchen prep surplus. Uncut, fresh, packed in dry crates.',
      category: 'PRODUCE',
      quantity: 60,
      quantityUnit: 'kg',
      preparationTime: new Date(now.getTime() - 2 * HOUR),
      pickupDeadline: new Date(now.getTime() + 10 * HOUR),
      foodCondition: 'CHILLED',
      address: 'Demo Hotel & Banquet, Kitchen Loading Bay, Residency Road',
      area: 'Residency Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      status: 'AVAILABLE',
    },
  });

  // Donation 3: bakery, available
  await prisma.donation.create({
    data: {
      donorId: donor2.id,
      title: 'Bakery Surplus: Bread Loaves & Buns',
      description: 'Fresh bread and buns baked today. Sealed packets, unsold at closing time.',
      category: 'BAKERY',
      quantity: 40,
      quantityUnit: 'boxes',
      preparationTime: new Date(now.getTime() - 3 * HOUR),
      pickupDeadline: new Date(now.getTime() + 6 * HOUR),
      foodCondition: 'PACKAGED_SEALED',
      address: 'Demo Restaurant & Catering, Back Entrance, 100ft Road',
      area: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      status: 'AVAILABLE',
    },
  });

  // Donation 4: hostel mess meals, available
  await prisma.donation.create({
    data: {
      donorId: donor3.id,
      title: 'Hostel Mess Surplus: Rice, Dal & Vegetable Curry',
      description: 'Extra dinner prepared for the hostel. Cooked today and kept covered and hot.',
      category: 'COOKED_MEALS',
      quantity: 100,
      quantityUnit: 'servings',
      preparationTime: new Date(now.getTime() - 1 * HOUR),
      pickupDeadline: new Date(now.getTime() + 3 * HOUR),
      foodCondition: 'FRESH_HOT',
      address: 'Demo University Hostel Mess, Campus Gate 3, Electronic City',
      area: 'Electronic City Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      imageUrl: cookedImage,
      status: 'AVAILABLE',
    },
  });

  // Donation 5: already completed, with a completed claim (shows "meals saved")
  const completedDonation = await prisma.donation.create({
    data: {
      donorId: donor2.id,
      title: 'Catering Surplus: Veg Biryani & Raita',
      description: 'Leftover biryani from a corporate event. Picked up by the NGO.',
      category: 'COOKED_MEALS',
      quantity: 120,
      quantityUnit: 'servings',
      preparationTime: new Date(now.getTime() - 8 * HOUR),
      pickupDeadline: new Date(now.getTime() - 4 * HOUR),
      foodCondition: 'FRESH_HOT',
      address: 'Demo Restaurant & Catering, Back Entrance, 100ft Road',
      area: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      imageUrl: cookedImage,
      status: 'COMPLETED',
    },
  });

  await prisma.claim.create({
    data: {
      donationId: completedDonation.id,
      receiverId: receiver1.id,
      status: 'COMPLETED',
      pickupOtp: '482913',
      createdAt: new Date(now.getTime() - 6 * HOUR),
      expiresAt: new Date(now.getTime() - 5.5 * HOUR),
      pickedUpAt: new Date(now.getTime() - 5.75 * HOUR),
    },
  });

  console.log('Database seeded successfully:');
  console.log('   Admin: admin@foodsurplus.org (Admin@123)');
  console.log(
    '   Donors: demo.hotel@donor.com, demo.restaurant@donor.com, demo.hostel@donor.com (Password@123)'
  );
  console.log('   Approved Receivers: demo.ngo1@ngo.com, demo.ngo2@ngo.com (Password@123)');
  console.log('   Pending Receiver: demo.volunteer@ngo.com (Password@123)');
  console.log('   Seeded 5 donations, 1 completed claim (120 meals saved).');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });