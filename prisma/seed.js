const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.report.deleteMany({});
  await prisma.claim.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // 1. Seed Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@foodsurplus.org',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      status: 'APPROVED',
      phone: '+91 98765 00001',
      organizationName: 'Food Surplus Connector HQ',
      organizationType: 'OTHER',
      address: 'Suite 400, Tech Park Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
  });

  // 2. Seed Donors
  const donor1 = await prisma.user.create({
    data: {
      email: 'taj.hotel@donor.com',
      passwordHash: defaultPassword,
      name: 'Chef Rajesh Sharma',
      role: 'DONOR',
      status: 'APPROVED',
      phone: '+91 98765 11111',
      organizationName: 'The Grand Palace Hotel & Banquet',
      organizationType: 'FUNCTION_HALL',
      address: 'Plot 42, Residency Road, Shanthala Nagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
    },
  });

  const donor2 = await prisma.user.create({
    data: {
      email: 'spicybites@donor.com',
      passwordHash: defaultPassword,
      name: 'Ananya Deshmukh',
      role: 'DONOR',
      status: 'APPROVED',
      phone: '+91 98765 22222',
      organizationName: 'Spicy Bites Restaurant & Catering',
      organizationType: 'RESTAURANT',
      address: '14th Cross, 100ft Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
    },
  });

  const donor3 = await prisma.user.create({
    data: {
      email: 'cityhostel@donor.com',
      passwordHash: defaultPassword,
      name: 'Ramesh Verma',
      role: 'DONOR',
      status: 'APPROVED',
      phone: '+91 98765 33333',
      organizationName: 'St. Jude University Hostel Mess',
      organizationType: 'HOSTEL',
      address: 'Campus Gate 3, Electronic City Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
    },
  });

  // 3. Seed Receivers (NGOs / Volunteers)
  const receiverApproved1 = await prisma.user.create({
    data: {
      email: 'robinhood@ngo.com',
      passwordHash: defaultPassword,
      name: 'Vikram Mehta',
      role: 'RECEIVER',
      status: 'APPROVED',
      phone: '+91 98765 44441',
      organizationName: 'Robin Hood Food Rescue Army',
      organizationType: 'NGO',
      documentUrl: 'https://example.com/docs/robin-hood-ngo-registration.pdf',
      address: 'Building 12, Koramangala 4th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
    },
  });

  const receiverApproved2 = await prisma.user.create({
    data: {
      email: 'hopecharity@ngo.com',
      passwordHash: defaultPassword,
      name: 'Priya Sundaram',
      role: 'RECEIVER',
      status: 'APPROVED',
      phone: '+91 98765 44442',
      organizationName: 'Hope Community Shelter & Kitchen',
      organizationType: 'NGO',
      documentUrl: 'https://example.com/docs/hope-shelter-charity-80g.pdf',
      address: '7th Main, BTM 2nd Stage',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560076',
    },
  });

  // Receiver with PENDING status to test Admin Verification feature
  const receiverPending = await prisma.user.create({
    data: {
      email: 'volunteer.arun@ngo.com',
      passwordHash: defaultPassword,
      name: 'Arun Kumar',
      role: 'RECEIVER',
      status: 'PENDING',
      phone: '+91 98765 55555',
      organizationName: 'Seva Youth Volunteer Corps',
      organizationType: 'VOLUNTEER',
      documentUrl: 'https://example.com/docs/arun-volunteer-id.pdf',
      address: '4th Cross, Malleshwaram',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560003',
    },
  });

  // 4. Seed Surplus Food Donations
  const now = new Date();

  // Donation 1: AVAILABLE Cooked Meals from Grand Palace Hotel
  const deadline1 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
  const prepTime1 = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
  await prisma.donation.create({
    data: {
      donorId: donor1.id,
      title: 'Buffet Surplus: Paneer Butter Masala, Jeera Rice & Naan',
      description:
        'Freshly cooked premium buffet banquet surplus. Packed in food-grade insulated containers, untouched and hygienically sealed.',
      category: 'COOKED_MEALS',
      quantity: 75,
      quantityUnit: 'servings',
      preparationTime: prepTime1,
      pickupDeadline: deadline1,
      foodCondition: 'FRESH_HOT',
      address: 'The Grand Palace Hotel, Service Gate 2, Plot 42, Residency Road',
      area: 'Residency Road / Shanthala Nagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
      status: 'AVAILABLE',
    },
  });

  // Donation 2: AVAILABLE Bakery & Breads
  const deadline2 = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  await prisma.donation.create({
    data: {
      donorId: donor2.id,
      title: 'Artisan Sourdough Loaves, Croissants & Muffin Boxes',
      description:
        'End-of-day fresh bakes from our afternoon cycle. Ideal for evening distribution to children shelters.',
      category: 'BAKERY',
      quantity: 40,
      quantityUnit: 'boxes',
      preparationTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      pickupDeadline: deadline2,
      foodCondition: 'SHELF_STABLE',
      address: 'Spicy Bites Bakery Annex, 14th Cross, 100ft Road',
      area: 'Indiranagar 100ft Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      status: 'AVAILABLE',
    },
  });

  // Donation 3: AVAILABLE Raw Produce & Vegetables
  const deadline3 = new Date(now.getTime() + 10 * 60 * 60 * 1000);
  await prisma.donation.create({
    data: {
      donorId: donor1.id,
      title: 'Crisp Farm Bell Peppers, Tomatoes, Potatoes & Onions',
      description:
        'High quality grade-A vegetables from kitchen banquet prep surplus. Uncut, fresh, dry crates.',
      category: 'PRODUCE',
      quantity: 60,
      quantityUnit: 'kg',
      pickupDeadline: deadline3,
      foodCondition: 'CHILLED',
      address: 'The Grand Palace Kitchen Loading Bay, Plot 42, Residency Road',
      area: 'Residency Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      status: 'AVAILABLE',
    },
  });

  // Donation 4: AVAILABLE Student Mess Cooked Meals
  const deadline4 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  await prisma.donation.create({
    data: {
      donorId: donor3.id,
      title: 'Steamed Basmati Rice, Mixed Vegetable Sambar & Curd',
      description:
        'Clean, nutritious hostel mess surplus stored in large warm steel cans. Easily serves 60+ individuals.',
      category: 'COOKED_MEALS',
      quantity: 65,
      quantityUnit: 'servings',
      preparationTime: new Date(now.getTime() - 45 * 60 * 1000),
      pickupDeadline: deadline4,
      foodCondition: 'FRESH_HOT',
      address: 'St. Jude University Campus Mess, Dining Hall C, Gate 3',
      area: 'Electronic City Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      status: 'AVAILABLE',
    },
  });

  // Donation 5: COMPLETED Donation with verified Claim & OTP (counts towards verified meals saved statistics)
  const completedDonation = await prisma.donation.create({
    data: {
      donorId: donor2.id,
      title: 'Vegetable Biryani & Mirchi Ka Salan Handover',
      description: 'Catering excess from corporate lunch conference.',
      category: 'COOKED_MEALS',
      quantity: 120,
      quantityUnit: 'servings',
      preparationTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      pickupDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      foodCondition: 'FRESH_HOT',
      address: 'Spicy Bites Banquet Hall, 14th Cross, 100ft Road',
      area: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      status: 'COMPLETED',
    },
  });

  await prisma.claim.create({
    data: {
      donationId: completedDonation.id,
      receiverId: receiverApproved1.id,
      status: 'COMPLETED',
      pickupOtp: '584920',
      expiresAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      pickedUpAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Database seeded successfully:');
  console.log('   Admin: admin@foodsurplus.org (Admin@123)');
  console.log('   Donors: taj.hotel@donor.com, spicybites@donor.com, cityhostel@donor.com (Password@123)');
  console.log('   Approved Receivers: robinhood@ngo.com, hopecharity@ngo.com (Password@123)');
  console.log('   Pending Receiver: volunteer.arun@ngo.com (Password@123)');
  console.log('   Seeded 5 realistic donations, 1 completed claim (120 confirmed meals saved).');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
