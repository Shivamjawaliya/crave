'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantDashboardPage from '../page';

export default function MenuRoute() {
  return <RestaurantDashboardPage initialTab="menu-inventory" />;
}
