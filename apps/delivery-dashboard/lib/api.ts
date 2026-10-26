const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  'http://localhost:3001/api/v1'
).replace(/\/+$/, '');

function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('delivery_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

function deliveryFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers as Record<string, string>),
  });
}

export interface DriverUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface DriverProfile {
  id: string;
  vehicleType: string;
  isAvailable: boolean;
  verificationStatus: string;
  approvalBadge: string;
  emergencyContact?: string;
  vehicleNumber?: string;
}

export interface DeliveryJobItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPricePaise: number;
}

export interface DeliveryTrip {
  id: string;
  orderId: string;
  partnerId?: string | null;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'ACCEPTED' | 'ARRIVED_AT_STORE' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED_AT_CUSTOMER' | 'DELIVERED' | 'CANCELLED';
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    deliveryFeePaise: number;
    subtotalPaise: number;
    addressSnapshot: {
      addressLine: string;
      city?: string;
      state?: string;
      pincode?: string;
      instructions?: string;
      pickupOtp?: string;
      verificationCode?: string;
      customerPhone?: string;
      phoneNumber?: string;
      phone?: string;
      customerName?: string;
      latitude?: number;
      longitude?: number;
    };
    restaurant: {
      id: string;
      name: string;
      address: string;
      latitude?: number | null;
      longitude?: number | null;
    };
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    items: DeliveryJobItem[];
  };
}

export interface DriverStats {
  todayTripsCount: number;
  todayEarnings: number;
  lifetimeTripsCount: number;
  lifetimeEarnings: number;
  activeOnlineHours: number;
  payoutBreakdown: {
    baseFare: number;
    distancePay: number;
    peakRushIncentive: number;
    tip: number;
  };
  weeklyEarnings: { day: string; amount: number; trips: number }[];
}

export interface DriverProfileResponse {
  user: DriverUser;
  profile: DriverProfile;
  stats: DriverStats;
}

// ---------------- API CALLS ----------------

export async function loginDriver(email: string, password: string) {
  const res = await deliveryFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function registerDriver(payload: {
  name: string;
  email: string;
  password: string;
  vehicleType: string;
  vehicleNumber?: string;
  phoneNumber?: string;
  emergencyContact?: string;
}) {
  const res = await deliveryFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      role: 'DELIVERY_PARTNER',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function fetchDriverProfile(partnerUserId: string): Promise<DriverProfileResponse> {
  const res = await deliveryFetch(`/delivery/profile/${partnerUserId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch driver profile');
  }
  return res.json();
}

export async function toggleDutyStatus(partnerUserId: string, isAvailable: boolean) {
  const res = await deliveryFetch(`/delivery/profile/${partnerUserId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable }),
  });
  return res.json();
}

export async function updateDriverDetails(
  partnerUserId: string,
  data: { vehicleType?: string; vehicleNumber?: string; emergencyContact?: string; name?: string },
) {
  const res = await deliveryFetch(`/delivery/profile/${partnerUserId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchAvailableJobs(): Promise<DeliveryTrip[]> {
  const res = await deliveryFetch('/delivery/jobs');
  if (!res.ok) return [];
  return res.json();
}

export async function fetchActiveTrip(partnerUserId: string): Promise<DeliveryTrip | null> {
  const res = await deliveryFetch(`/delivery/active/${partnerUserId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function acceptDeliveryJob(deliveryId: string, partnerUserId: string): Promise<DeliveryTrip> {
  const res = await deliveryFetch(`/delivery/jobs/${deliveryId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ partnerUserId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to accept delivery job');
  }
  return data;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: string,
  extraData?: { verificationCode?: string; reason?: string },
) {
  const res = await deliveryFetch(`/delivery/jobs/${deliveryId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...extraData }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update delivery status');
  }
  return data;
}

export async function sendGpsCoordinates(
  deliveryId: string,
  coords: { latitude: number; longitude: number },
) {
  try {
    await deliveryFetch(`/delivery/jobs/${deliveryId}/location`, {
      method: 'POST',
      body: JSON.stringify(coords),
    });
  } catch {}
}

export async function reportTripIssue(
  deliveryId: string,
  partnerUserId: string,
  reason: string,
  notes?: string,
) {
  const res = await deliveryFetch(`/delivery/jobs/${deliveryId}/report-issue`, {
    method: 'POST',
    body: JSON.stringify({ partnerUserId, reason, notes }),
  });
  return res.json();
}
