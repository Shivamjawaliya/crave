export interface RestaurantOwnerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurant?: {
    id: string;
    name: string;
    address: string;
    description?: string;
    isAcceptingOrders?: boolean;
  } | null;
}

export function getOwnerUser(): RestaurantOwnerUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('restaurant_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function getOwnerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('restaurant_access_token');
}

export function setOwnerSession(user: RestaurantOwnerUser, accessToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('restaurant_user', JSON.stringify(user));
  localStorage.setItem('restaurant_access_token', accessToken);
  document.cookie = `restaurant_token=${accessToken}; path=/; max-age=604800`;
}

export function clearOwnerSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('restaurant_user');
  localStorage.removeItem('restaurant_access_token');
  document.cookie = 'restaurant_token=; path=/; max-age=0';
}
