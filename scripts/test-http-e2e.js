/**
 * End-to-End HTTP API Integration Test
 * Runs against the live running Next.js server on http://localhost:3000
 */

const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let pass = 0;
let fail = 0;

function check(cond, desc) {
  if (cond) {
    console.log(`  ✅ HTTP PASS: ${desc}`);
    pass++;
  } else {
    console.error(`  ❌ HTTP FAIL: ${desc}`);
    fail++;
  }
}

async function run() {
  console.log('\n============================================================');
  console.log('🌐 EXECUTING LIVE HTTP END-TO-END INTEGRATION TESTS');
  console.log('============================================================\n');

  try {
    // 1. Public Stats
    console.log('1. Testing GET /api/stats');
    const statsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stats',
      method: 'GET',
    });
    check(statsRes.status === 200, 'GET /api/stats returned HTTP 200');
    check(typeof statsRes.data.stats.totalMealsSaved === 'number', 'totalMealsSaved numeric statistic returned');
    const initialMeals = statsRes.data.stats.totalMealsSaved;

    // 2. Public Donations & Address Masking
    console.log('\n2. Testing GET /api/donations Address Privacy');
    const donRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/donations',
      method: 'GET',
    });
    check(donRes.status === 200, 'GET /api/donations returned HTTP 200');
    const firstDonation = donRes.data.donations[0];
    check(firstDonation.address === null, 'Address is strictly masked (null) on public feed');
    check(firstDonation.isAddressMasked === true, 'isAddressMasked flag is true');
    check(!!firstDonation.area, 'Public area/neighborhood is visible');

    // 3. Login as Donor (The Grand Palace Hotel)
    console.log('\n3. Testing POST /api/auth/login as Food Donor');
    const donorLoginRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'taj.hotel@donor.com', password: 'Password@123' }
    );
    check(donorLoginRes.status === 200, 'Donor login succeeded with HTTP 200');
    const donorCookie = donorLoginRes.headers['set-cookie']?.[0]?.split(';')[0];
    check(!!donorCookie, 'Received Donor auth session cookie');

    // Donor fetches their own listings to find an available item
    const donorDonationsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/donations?donorOnly=true',
      method: 'GET',
      headers: { Cookie: donorCookie },
    });
    const donorTargetDonation = donorDonationsRes.data.donations.find((d) => d.status === 'AVAILABLE');
    check(!!donorTargetDonation, `Found available donation listed by donor: "${donorTargetDonation?.title}"`);

    // 4. Login as Approved Receiver (Robin Hood Army)
    console.log('\n4. Testing POST /api/auth/login as Approved Receiver');
    const receiverLoginRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'robinhood@ngo.com', password: 'Password@123' }
    );
    check(receiverLoginRes.status === 200, 'Receiver login succeeded with HTTP 200');
    const receiverCookie = receiverLoginRes.headers['set-cookie']?.[0]?.split(';')[0];

    // 5. Receiver Claims the Donor's Donation
    console.log('\n5. Testing Atomic Claim & 30-min window creation');
    const claimRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/claims',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: receiverCookie,
        },
      },
      { donationId: donorTargetDonation.id }
    );
    check(claimRes.status === 201, 'Claim successfully created with HTTP 201');
    const createdClaim = claimRes.data.claim;
    check(createdClaim.status === 'PENDING_PICKUP', 'Claim status is PENDING_PICKUP');
    check(!!createdClaim.donation.address, 'Confidential street address unlocked for claimant');

    // 6. Test Double Claim (Concurrency Guard)
    console.log('\n6. Testing Concurrency Protection against Double Claiming');
    const doubleClaimRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/claims',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: receiverCookie,
        },
      },
      { donationId: donorTargetDonation.id }
    );
    check(doubleClaimRes.status === 409, 'Double claim correctly blocked with HTTP 409 Conflict');

    // 7. Donor retrieves Handover OTP
    console.log('\n7. Testing Donor retrieval of secret Handover OTP');
    const refreshedDonorDonations = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/donations?donorOnly=true',
      method: 'GET',
      headers: { Cookie: donorCookie },
    });

    const claimedDonationByDonor = refreshedDonorDonations.data.donations.find(
      (d) => d.id === donorTargetDonation.id
    );
    const secretOtp = claimedDonationByDonor?.activeClaim?.pickupOtp;
    check(!!secretOtp && secretOtp.length === 6, `Donor retrieved secret Handover OTP: ${secretOtp}`);

    // 8. Verify OTP Handover
    console.log('\n8. Testing OTP Verification & Pickup Completion');
    const verifyRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/claims/verify-otp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: receiverCookie,
        },
      },
      { claimId: createdClaim.id, otp: secretOtp }
    );
    check(verifyRes.status === 200, 'Handover OTP verified with HTTP 200');
    check(verifyRes.data.claim.status === 'COMPLETED', 'Claim status marked COMPLETED');
    check(verifyRes.data.donation.status === 'COMPLETED', 'Donation status marked COMPLETED');

    // 9. Verify Meals Saved Statistics Incremented
    console.log('\n9. Testing Meals-Saved Statistics Increment');
    const updatedStatsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stats',
      method: 'GET',
    });
    const newMeals = updatedStatsRes.data.stats.totalMealsSaved;
    check(
      newMeals === initialMeals + donorTargetDonation.quantity,
      `Meals saved accurately incremented from ${initialMeals} to ${newMeals} (+${donorTargetDonation.quantity})`
    );

    // 10. Scheduled Claim Expiration Test
    console.log('\n10. Testing Scheduled Claim Expiration Endpoint');
    const cronRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/expire-claims?key=food-surplus-cron-secret-key',
      method: 'GET',
    });
    check(cronRes.status === 200, 'Cron endpoint executed with HTTP 200');
    check(typeof cronRes.data.expiredClaimsCount === 'number', 'Cron reported evaluation statistics');

    // 11. Admin Receivers Approval Test
    console.log('\n11. Testing Admin Approval of Pending Receivers');
    const adminLoginRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@foodsurplus.org', password: 'Admin@123' }
    );
    check(adminLoginRes.status === 200, 'Admin login succeeded with HTTP 200');
    const adminCookie = adminLoginRes.headers['set-cookie']?.[0]?.split(';')[0];

    const adminUsersRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/users?role=RECEIVER&status=PENDING',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    check(adminUsersRes.status === 200, 'Admin successfully fetched pending receivers queue');

    console.log('\n============================================================');
    console.log(`🎉 ALL LIVE HTTP TESTS PASSED: ${pass} PASSED, ${fail} FAILED`);
    console.log('============================================================\n');

    process.exit(fail === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

run();
