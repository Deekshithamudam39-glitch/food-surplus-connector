export type UserRole = 'DONOR' | 'RECEIVER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type OrgType = 'RESTAURANT' | 'HOSTEL' | 'FUNCTION_HALL' | 'NGO' | 'VOLUNTEER' | 'INDIVIDUAL' | 'OTHER';

export type FoodCategory =
  | 'COOKED_MEALS'
  | 'RAW_INGREDIENTS'
  | 'PACKAGED_FOOD'
  | 'BAKERY'
  | 'PRODUCE'
  | 'DAIRY'
  | 'OTHER';

export type FoodCondition =
  | 'FRESH_HOT'
  | 'CHILLED'
  | 'PACKAGED_SEALED'
  | 'SHELF_STABLE'
  | 'PERISHABLE_SOON';

export type DonationStatus =
  | 'AVAILABLE'
  | 'CLAIMED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type ClaimStatus =
  | 'PENDING_PICKUP'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organizationName?: string | null;
  organizationType?: OrgType | null;
}

export interface SanitizedDonation {
  id: string;
  donorId: string;
  donorName: string;
  organizationName?: string | null;
  organizationType?: string | null;
  title: string;
  description?: string | null;
  category: string;
  quantity: number;
  quantityUnit: string;
  preparationTime?: string | null;
  pickupDeadline: string;
  foodCondition: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  // Confidential - only populated for authorized users:
  exactAddress?: string | null;
  activeClaim?: {
    id: string;
    status: string;
    expiresAt: string;
    receiverId: string;
    receiverName?: string;
    pickupOtp?: string;
  } | null;
}
