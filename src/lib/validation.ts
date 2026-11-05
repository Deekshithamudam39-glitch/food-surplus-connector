import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['DONOR', 'RECEIVER', 'ADMIN']),
  phone: z.string().min(10, 'Please enter a valid phone number').optional().or(z.literal('')),
  organizationName: z.string().min(2, 'Organization name is required').optional().or(z.literal('')),
  organizationType: z
    .enum(['RESTAURANT', 'HOSTEL', 'FUNCTION_HALL', 'NGO', 'VOLUNTEER', 'INDIVIDUAL', 'OTHER'])
    .optional(),
  documentUrl: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createDonationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().max(1000).optional().or(z.literal('')),
  category: z.enum([
    'COOKED_MEALS',
    'RAW_INGREDIENTS',
    'PACKAGED_FOOD',
    'BAKERY',
    'PRODUCE',
    'DAIRY',
    'OTHER',
  ]),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  quantityUnit: z.string().default('servings'),
  preparationTime: z.string().optional().or(z.literal('')),
  pickupDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid pickup deadline date is required',
  }),
  foodCondition: z.enum([
    'FRESH_HOT',
    'CHILLED',
    'PACKAGED_SEALED',
    'SHELF_STABLE',
    'PERISHABLE_SOON',
  ]),
  address: z.string().min(5, 'Full street address is required for pickup'),
  area: z.string().min(2, 'Public neighborhood/area is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  imageUrl: z.string().optional().or(z.literal('')),
});

export const createClaimSchema = z.object({
  donationId: z.string().min(1, 'Donation ID is required'),
});

export const verifyOtpSchema = z.object({
  claimId: z.string().min(1, 'Claim ID is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const updateReceiverStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING']),
});

export const createReportSchema = z.object({
  donationId: z.string().optional(),
  claimId: z.string().optional(),
  reason: z.string().min(3, 'Reason is required'),
  details: z.string().min(10, 'Please provide more details'),
});
