import { PrismaClient, UserRole, RestaurantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding authentic culinary restaurants, menus, and items...');

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

  // 2. Head Chef / Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@spicybites.com' },
    update: {},
    create: {
      name: 'Chef Marco Bellini',
      email: 'owner@spicybites.com',
      passwordHash,
      role: UserRole.RESTAURANT_OWNER,
      isActive: true,
    },
  });

  // 3. Delivery Partner
  await prisma.user.upsert({
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
          vehicleType: 'Electric Scooter',
          isAvailable: true,
        },
      },
    },
  });

  // 4. Default Customer
  await prisma.user.upsert({
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
          addressLine: '742 Evergreen Terr, Apt 4B',
          city: 'Downtown Metro',
          state: 'Metropolis',
          pincode: '10001',
          latitude: 40.7128,
          longitude: -74.006,
          isDefault: true,
        },
      },
    },
  });

  // List of real authentic restaurants matching the Stitch design
  const realRestaurants = [
    {
      name: 'Umai Ramen & Izakaya',
      description: 'Japanese • Tonkotsu • Hand-pulled Noodles • Gyoza',
      address: '742 Evergreen Terr, Downtown Metro',
      latitude: 40.713,
      longitude: -74.0055,
      categories: [
        {
          name: 'Signature Ramen Bowls',
          sortOrder: 1,
          items: [
            {
              name: 'Black Garlic Tonkotsu Ramen',
              description: '18-hour slow-simmered pork bone broth, tender chashu pork, ajitsuke tamago, wood ear mushroom, scallions, and roasted black garlic oil.',
              pricePaise: 58000, // ₹580 ($21.50)
              imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Spicy Hokkaido Miso Tantanmen',
              description: 'Red miso broth infused with sesame paste, wok-seared chili pork mince, tender pak choi, and spring onions.',
              pricePaise: 52000,
              imageUrl: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          name: 'Izakaya Small Plates',
          sortOrder: 2,
          items: [
            {
              name: 'Crispy Kurobuta Pork Gyoza (6 pcs)',
              description: 'Pan-crisped handmade dumplings stuffed with Berkshire pork, ginger, and scallions with chili rayu ponzu.',
              pricePaise: 32000,
              imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Tokyo Street Karaage Chicken',
              description: 'Double-fried ginger soy chicken bites served with Japanese kewpie mayo and fresh lemon wedge.',
              pricePaise: 38000,
              imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Tartine Artisan Bakery',
      description: 'Organic Sourdough • Viennoiserie • Pain au Chocolat • Croissants',
      address: '58 Baker Square, Downtown Metro',
      latitude: 40.7145,
      longitude: -74.004,
      categories: [
        {
          name: 'Organic Sourdough Loaves',
          sortOrder: 1,
          items: [
            {
              name: 'Country Sourdough Batard',
              description: '36-hour wild yeast fermentation, stone-milled heritage grain flour with a deep caramelized, blistered crust.',
              pricePaise: 35000,
              imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Toasted Seed & Grain Miche',
              description: 'Hearty whole wheat sourdough folded with toasted sunflower, pumpkin, flax seeds, and dark rye malt.',
              pricePaise: 38000,
              imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          name: 'Handcrafted Viennoiserie',
          sortOrder: 2,
          items: [
            {
              name: 'Double Baked Almond Croissant',
              description: 'Flaky Normandy butter croissant brushed with vanilla bean syrup, filled with rich almond frangipane, topped with toasted sliced almonds.',
              pricePaise: 24000,
              imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Cardamom Morning Bun',
              description: 'Croissant dough rolled in freshly crushed organic cardamom, brown cane sugar, and orange blossom zest.',
              pricePaise: 22000,
              imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Nori Bistro & Sushi',
      description: 'Omakase • Bluefin Nigiri • Poke Bowls • Sashimi',
      address: '102 Ocean Promenade, Downtown Metro',
      latitude: 40.7115,
      longitude: -74.008,
      categories: [
        {
          name: 'Omakase & Fresh Nigiri',
          sortOrder: 1,
          items: [
            {
              name: 'Chef Omakase Nigiri Set (8 pcs)',
              description: 'Daily market selection including Bluefin Chu-Toro, Ora King Salmon, Hamachi, Sweet Botanical Ebi, and Hokkaido Scallop.',
              pricePaise: 85000,
              imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Torched Truffle Salmon Aburi Roll',
              description: 'Atlantic salmon torched with white truffle oil, avocado, cucumber, unagi reduction, and tobiko roe.',
              pricePaise: 65000,
              imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          name: 'Signature Poke Bowls',
          sortOrder: 2,
          items: [
            {
              name: 'Spicy Bluefin Tuna Poke Bowl',
              description: 'Sashimi bluefin tuna, toasted sesame shoyu, edamame, seaweed salad, pickled ginger, and toasted nori on seasoned sushi rice.',
              pricePaise: 69000,
              imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Lucia Wood-Fired Pizza',
      description: 'Campania Pizza • Handmade Mozzarella • Neapolitan',
      address: '21 Via Napoli, Downtown Metro',
      latitude: 40.715,
      longitude: -74.002,
      categories: [
        {
          name: 'Wood-Fired Neapolitan Classics',
          sortOrder: 1,
          items: [
            {
              name: 'Margherita Di Bufala D.O.P.',
              description: 'Crushed San Marzano tomatoes, Campania buffalo mozzarella, fresh sweet basil, and Sicilian extra virgin olive oil baked at 900°F.',
              pricePaise: 55000,
              imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Tartufata con Funghi Selvatici',
              description: 'Fior di latte mozzarella, roasted cremini and chanterelle mushrooms, thyme, white truffle crema, and sea salt.',
              pricePaise: 68000,
              imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Diavola Hot Wildflower Honey',
              description: 'Spicy Calabrese soppressata, smoked provolone, fresh oregano, and a generous drizzle of spicy chili-infused hot honey.',
              pricePaise: 64000,
              imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Smash & Co. Handcrafted Burgers',
      description: 'Gourmet Burgers • Garlic Truffle Fries • Milkshakes',
      address: '45 Market St, Downtown Metro',
      latitude: 40.7135,
      longitude: -74.0045,
      categories: [
        {
          name: 'Artisan Smash Burgers',
          sortOrder: 1,
          items: [
            {
              name: 'The Truffle Melt Double Smash',
              description: 'Two dry-aged certified Angus beef patties smashed lacey-thin, black truffle garlic aioli, aged sharp cheddar, and toasted potato brioche bun.',
              pricePaise: 48000,
              imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Oklahoma Sweet Onion Smash',
              description: 'Patties seared directly into razor-thin sweet Vidalia onions, double American cheese, dill pickle chips, and secret tangy sauce.',
              pricePaise: 44000,
              imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          name: 'Sides & Hand-Spun Shakes',
          sortOrder: 2,
          items: [
            {
              name: 'Rosemary Garlic Parmesan Fries',
              description: 'Twice-cooked Idaho russet fries tossed with freshly grated Parmigiano-Reggiano, roasted garlic butter, and chopped rosemary.',
              pricePaise: 22000,
              imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Salted Caramel Pretzel Gelato Shake',
              description: 'Madagascar vanilla bean gelato, house burnt butter caramel, crushed sea salt pretzels, and fresh whipped cream.',
              pricePaise: 26000,
              imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Olive & Thyme Greens',
      description: 'Mediterranean Bowls • Crisp Salads • Vegan',
      address: '88 Botanical Way, Downtown Metro',
      latitude: 40.712,
      longitude: -74.007,
      categories: [
        {
          name: 'Nourish & Mezze Bowls',
          sortOrder: 1,
          items: [
            {
              name: 'Herbed Falafel & Beet Hummus Bowl',
              description: 'Crispy green herb falafel, roasted beetroot hummus, warm organic quinoa, Persian cucumber ribbons, kalamata olives, and lemon-tahini dressing.',
              pricePaise: 39000,
              imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Citrus Avocado & Tuscan Kale Salad',
              description: 'Tuscan lacinato kale massaged with EVOO, Cara Cara orange segments, Hass avocado, toasted pepitas, and pomegranate reduction.',
              pricePaise: 36000,
              imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Tacos Del Sol Taquería',
      description: 'Birria Tacos • Fresh Guacamole • Horchata',
      address: '14 Sunset Boulevard, Downtown Metro',
      latitude: 40.714,
      longitude: -74.009,
      categories: [
        {
          name: 'Tradicional Mexican Tacos',
          sortOrder: 1,
          items: [
            {
              name: 'Slow-Braised Quesabirria Tacos (3 pcs)',
              description: 'Slow-simmered beef shank in chili adobo, melted Oaxaca cheese on griddled corn tortillas, served with rich consommé for dipping.',
              pricePaise: 45000,
              imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Crispy Baja Cod Tacos',
              description: 'Wild Pacific cod in light cornmeal batter, fresh avocado salsa verde, shaved cabbage slaw, and chipotle lime crema.',
              pricePaise: 42000,
              imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: 'Kinfolk Roastery & Cafe',
      description: 'Single-Origin Pour Over • Espresso • Pastries',
      address: '12 Arts District Way, Downtown Metro',
      latitude: 40.7125,
      longitude: -74.003,
      categories: [
        {
          name: 'Specialty Coffee & Bakes',
          sortOrder: 1,
          items: [
            {
              name: 'Ethiopian Yirgacheffe Chemex Pour Over',
              description: 'Direct-trade light roast with jasmine floral notes, candied bergamot, and sweet stone fruit finish.',
              pricePaise: 22000,
              imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Valrhona Dark Chocolate Babka Slice',
              description: 'Brioche dough swirled with 70% French Valrhona chocolate, toasted hazelnuts, and fleur de sel.',
              pricePaise: 24000,
              imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      name: "L'Atelier Charcoal Wagyu",
      description: 'Michelin Highlight • Charcoal A5 Wagyu • French-Japanese Haute Cuisine',
      address: '1 Grand Promenade, Downtown Metro',
      latitude: 40.716,
      longitude: -74.001,
      categories: [
        {
          name: "Chef's Tasting Highlights",
          sortOrder: 1,
          items: [
            {
              name: "L'Atelier Charcoal Wagyu Tenderloin",
              description: 'Miyazaki A5 Wagyu seared over Binchotan charcoal, roasted wild morels, glazed pearl onions, and 48-hour bone marrow jus.',
              pricePaise: 145000, // ₹1,450
              imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
  ];

  for (const r of realRestaurants) {
    const existing = await prisma.restaurant.findFirst({
      where: { name: r.name },
    });

    if (!existing) {
      await prisma.restaurant.create({
        data: {
          name: r.name,
          description: r.description,
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
          status: RestaurantStatus.APPROVED,
          ownerId: owner.id,
          categories: {
            create: r.categories.map((c) => ({
              name: c.name,
              sortOrder: c.sortOrder,
              items: {
                create: c.items.map((item) => ({
                  name: item.name,
                  description: item.description,
                  pricePaise: item.pricePaise,
                  imageUrl: item.imageUrl,
                  isAvailable: true,
                })),
              },
            })),
          },
        },
      });
      console.log(`🍽️ Restaurant created: ${r.name}`);
    } else {
      console.log(`✔️ Restaurant already exists: ${r.name}`);
    }
  }

  console.log('✅ Real database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
