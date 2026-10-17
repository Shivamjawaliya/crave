import { PrismaClient, UserRole, RestaurantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodapp.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@foodapp.com',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // 2. Restaurant Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@spicybites.com' },
    update: {},
    create: {
      name: 'Chef Marco',
      email: 'owner@spicybites.com',
      passwordHash,
      role: UserRole.RESTAURANT_OWNER,
      isActive: true,
    },
  });
  console.log(`👤 Restaurant Owner created: ${owner.email}`);

  // 3. Delivery Partner
  const partner = await prisma.user.upsert({
    where: { email: 'delivery@speedy.com' },
    update: {},
    create: {
      name: 'Alex Rider',
      email: 'delivery@speedy.com',
      passwordHash,
      role: UserRole.DELIVERY_PARTNER,
      isActive: true,
      deliveryProfile: {
        create: {
          vehicleType: 'Motorcycle',
          isAvailable: true,
        },
      },
    },
  });
  console.log(`👤 Delivery Partner created: ${partner.email}`);

  // 4. Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'customer@gmail.com',
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      addresses: {
        create: {
          label: 'Home',
          addressLine: 'Flat 402, Sunshine Heights, MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          latitude: 12.9716,
          longitude: 77.5946,
          isDefault: true,
        },
      },
    },
  });
  console.log(`👤 Customer created: ${customer.email}`);

  // 5. Seed Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Spicy Bites Kitchen',
      description: 'Authentic Indian delicacies, smoky tandoor, and curries cooked to perfection.',
      address: '12 Brigade Road, Bengaluru, Karnataka 560025',
      latitude: 12.9719,
      longitude: 77.5937,
      status: RestaurantStatus.APPROVED,
      ownerId: owner.id,
      categories: {
        create: [
          {
            name: 'Starters & Tandoor',
            sortOrder: 1,
            items: {
              create: [
                {
                  name: 'Paneer Tikka Royale',
                  description: 'Cottage cheese marinated in royal spices and charred in clay oven.',
                  pricePaise: 28000, // ₹280.00
                  imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500',
                  isAvailable: true,
                },
                {
                  name: 'Murgh Malai Kebab',
                  description: 'Creamy tender chicken kebabs infused with cardamom and cheese.',
                  pricePaise: 34000, // ₹340.00
                  imageUrl: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500',
                  isAvailable: true,
                },
              ],
            },
          },
          {
            name: 'Main Course & Biryanis',
            sortOrder: 2,
            items: {
              create: [
                {
                  name: 'Dum Hyderabadi Biryani',
                  description: 'Fragrant basmati rice layered with spiced meat and saffron.',
                  pricePaise: 39000, // ₹390.00
                  imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
                  isAvailable: true,
                },
                {
                  name: 'Dal Makhani Bukhara',
                  description: 'Slow-simmered black lentils with rich butter and cream.',
                  pricePaise: 24000, // ₹240.00
                  imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
                  isAvailable: true,
                },
              ],
            },
          },
          {
            name: 'Beverages & Desserts',
            sortOrder: 3,
            items: {
              create: [
                {
                  name: 'Mango Lassi',
                  description: 'Thick creamy yogurt churned with Alphonso mango pulp.',
                  pricePaise: 12000, // ₹120.00
                  imageUrl: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=500',
                  isAvailable: true,
                },
                {
                  name: 'Gulab Jamun (2 pcs)',
                  description: 'Golden fried dumplings soaked in aromatic rose-cardamom syrup.',
                  pricePaise: 9000, // ₹90.00
                  imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
                  isAvailable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`🍽️ Restaurant created: ${restaurant.name} with categories & items`);
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
