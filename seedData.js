const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Service = require('./models/Service');
const Booking = require('./models/Booking');
const Chat = require('./models/Chat');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample data
const sampleUsers = [
  // Admin user
  {
    firstName: 'Amina',
    lastName: 'Al Farsi',
    email: 'admin@fixlink.com',
    password: 'admin123',
    role: 'admin',
    phone: '+971501234567',
    address: 'Office 101, Business Bay, Dubai, UAE',
    isActive: true
  },
  // Customer users
  {
    firstName: 'Omar',
    lastName: 'Al Mansoori',
    email: 'omar@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+971502345678',
    address: 'Palm Jumeirah, Dubai, UAE',
    isActive: true
  },
  {
    firstName: 'Fatima',
    lastName: 'Al Suwaidi',
    email: 'fatima@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+971503456789',
    address: 'Downtown Dubai, Dubai, UAE',
    isActive: true
  },
  {
    firstName: 'Yousef',
    lastName: 'Al Nuaimi',
    email: 'yousef@example.com',
    password: 'password123',
    role: 'customer',
    phone: '+971504567890',
    address: 'Jumeirah Beach Residence, Dubai, UAE',
    isActive: true
  },
  // Provider users
  {
    firstName: 'Khalid',
    lastName: 'Al Habtoor',
    email: 'khalid@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+971505678901',
    address: 'Al Barsha, Dubai, UAE',
    specialization: 'Plumbing',
    experience: 8,
    bio: 'Experienced plumber in Dubai with 8 years of professional experience. Specializing in residential and commercial plumbing services.',
    isActive: true
  },
  {
    firstName: 'Layla',
    lastName: 'Al Mazrouei',
    email: 'layla@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+971506789012',
    address: 'Dubai Marina, Dubai, UAE',
    specialization: 'Cleaning',
    experience: 5,
    bio: 'Professional cleaning specialist in Dubai with 5 years of experience. Providing thorough and reliable cleaning services.',
    isActive: true
  },
  {
    firstName: 'Saeed',
    lastName: 'Al Falasi',
    email: 'saeed@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+971507890123',
    address: 'JLT, Dubai, UAE',
    specialization: 'Electrical',
    experience: 12,
    bio: 'Licensed electrician in Dubai with 12 years of experience. Expert in electrical installations and repairs.',
    isActive: true
  },
  {
    firstName: 'Maha',
    lastName: 'Al Qassimi',
    email: 'maha@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+971508901234',
    address: 'Arabian Ranches, Dubai, UAE',
    specialization: 'Gardening',
    experience: 6,
    bio: 'Landscape designer and gardener in Dubai with 6 years of experience. Creating beautiful outdoor spaces.',
    isActive: true
  },
  {
    firstName: 'Faisal',
    lastName: 'Al Shamsi',
    email: 'faisal@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+971509012345',
    address: 'Deira, Dubai, UAE',
    specialization: 'Painting',
    experience: 9,
    bio: 'Professional painter in Dubai with 9 years of experience. Specializing in interior and exterior painting.',
    isActive: true
  },
  {
    firstName: 'Noor',
    lastName: 'Al Marri',
    email: 'noor@example.com',
    password: 'password123',
    role: 'provider',
    phone: '+971510123456',
    address: 'Al Nahda, Dubai, UAE',
    specialization: 'Carpentry',
    experience: 7,
    bio: 'Skilled carpenter in Dubai with 7 years of experience. Expert in custom woodwork and repairs.',
    isActive: true
  }
];

const sampleServices = [
  {
    name: 'Emergency Plumbing Repair',
    category: 'plumbing',
    description: '24/7 emergency plumbing services including leak repairs, pipe fixes, and drain cleaning. Available for urgent situations.',
    price: 85,
    priceType: 'hourly',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 25,
    availability: {
      monday: { start: '08:00', end: '20:00', available: true },
      tuesday: { start: '08:00', end: '20:00', available: true },
      wednesday: { start: '08:00', end: '20:00', available: true },
      thursday: { start: '08:00', end: '20:00', available: true },
      friday: { start: '08:00', end: '20:00', available: true },
      saturday: { start: '08:00', end: '20:00', available: true },
      sunday: { start: '08:00', end: '20:00', available: true }
    },
    isActive: true
  },
  {
    name: 'Deep House Cleaning',
    category: 'cleaning',
    description: 'Comprehensive house cleaning service including kitchen, bathrooms, living areas, and bedrooms. Eco-friendly cleaning products used.',
    price: 120,
    priceType: 'fixed',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 20,
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '09:00', end: '17:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Electrical Installation',
    category: 'electrical',
    description: 'Professional electrical installation services for outlets, switches, lighting fixtures, and electrical panels. Licensed and insured.',
    price: 95,
    priceType: 'hourly',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 30,
    availability: {
      monday: { start: '08:00', end: '18:00', available: true },
      tuesday: { start: '08:00', end: '18:00', available: true },
      wednesday: { start: '08:00', end: '18:00', available: true },
      thursday: { start: '08:00', end: '18:00', available: true },
      friday: { start: '08:00', end: '18:00', available: true },
      saturday: { start: '08:00', end: '18:00', available: false },
      sunday: { start: '08:00', end: '18:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Garden Design & Maintenance',
    category: 'gardening',
    description: 'Complete garden design and maintenance service including planting, pruning, lawn care, and seasonal maintenance.',
    price: 75,
    priceType: 'hourly',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 15,
    availability: {
      monday: { start: '07:00', end: '16:00', available: true },
      tuesday: { start: '07:00', end: '16:00', available: true },
      wednesday: { start: '07:00', end: '16:00', available: true },
      thursday: { start: '07:00', end: '16:00', available: true },
      friday: { start: '07:00', end: '16:00', available: true },
      saturday: { start: '07:00', end: '16:00', available: true },
      sunday: { start: '07:00', end: '16:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Interior Painting Service',
    category: 'painting',
    description: 'Professional interior painting service including walls, ceilings, and trim. Premium quality paints and materials included.',
    price: 65,
    priceType: 'hourly',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 25,
    availability: {
      monday: { start: '08:00', end: '17:00', available: true },
      tuesday: { start: '08:00', end: '17:00', available: true },
      wednesday: { start: '08:00', end: '17:00', available: true },
      thursday: { start: '08:00', end: '17:00', available: true },
      friday: { start: '08:00', end: '17:00', available: true },
      saturday: { start: '08:00', end: '17:00', available: false },
      sunday: { start: '08:00', end: '17:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Custom Cabinet Installation',
    category: 'carpentry',
    description: 'Custom cabinet design and installation for kitchens, bathrooms, and storage areas. Quality craftsmanship guaranteed.',
    price: 110,
    priceType: 'hourly',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 20,
    availability: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '08:00', end: '16:00', available: false },
      sunday: { start: '08:00', end: '16:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Drain Cleaning Service',
    category: 'plumbing',
    description: 'Professional drain cleaning using advanced equipment to clear clogs and restore proper drainage.',
    price: 70,
    priceType: 'fixed',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 25,
    availability: {
      monday: { start: '08:00', end: '18:00', available: true },
      tuesday: { start: '08:00', end: '18:00', available: true },
      wednesday: { start: '08:00', end: '18:00', available: true },
      thursday: { start: '08:00', end: '18:00', available: true },
      friday: { start: '08:00', end: '18:00', available: true },
      saturday: { start: '08:00', end: '18:00', available: true },
      sunday: { start: '08:00', end: '18:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Office Cleaning Service',
    category: 'cleaning',
    description: 'Regular office cleaning service including dusting, vacuuming, sanitizing, and restroom maintenance.',
    price: 150,
    priceType: 'fixed',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 25,
    availability: {
      monday: { start: '18:00', end: '22:00', available: true },
      tuesday: { start: '18:00', end: '22:00', available: true },
      wednesday: { start: '18:00', end: '22:00', available: true },
      thursday: { start: '18:00', end: '22:00', available: true },
      friday: { start: '18:00', end: '22:00', available: true },
      saturday: { start: '18:00', end: '22:00', available: false },
      sunday: { start: '18:00', end: '22:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Ceiling Fan Installation',
    category: 'electrical',
    description: 'Professional ceiling fan installation service including wiring, mounting, and testing. All safety standards followed.',
    price: 80,
    priceType: 'fixed',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 30,
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '09:00', end: '17:00', available: false }
    },
    isActive: true
  },
  {
    name: 'Lawn Mowing & Maintenance',
    category: 'gardening',
    description: 'Regular lawn mowing and maintenance service including edging, trimming, and cleanup.',
    price: 45,
    priceType: 'fixed',
    location: {
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    serviceArea: 20,
    availability: {
      monday: { start: '07:00', end: '15:00', available: true },
      tuesday: { start: '07:00', end: '15:00', available: true },
      wednesday: { start: '07:00', end: '15:00', available: true },
      thursday: { start: '07:00', end: '15:00', available: true },
      friday: { start: '07:00', end: '15:00', available: true },
      saturday: { start: '07:00', end: '15:00', available: true },
      sunday: { start: '07:00', end: '15:00', available: false }
    },
    isActive: true
  }
];

const sampleBookings = [
  {
    scheduledDate: '2024-01-15',
    scheduledTime: '10:00',
    duration: 2,
    location: {
      address: '123 Main St, City, State 12345',
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    description: 'Kitchen sink is clogged and water is backing up',
    specialInstructions: 'Please bring drain cleaning equipment',
    status: 'completed',
    totalAmount: 170
  },
  {
    scheduledDate: '2024-01-20',
    scheduledTime: '14:00',
    duration: 4,
    location: {
      address: '456 Oak Ave, City, State 12345',
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    description: 'Deep cleaning needed for 3-bedroom apartment',
    specialInstructions: 'Focus on kitchen and bathrooms',
    status: 'confirmed',
    totalAmount: 120
  },
  {
    scheduledDate: '2024-01-25',
    scheduledTime: '09:00',
    duration: 3,
    location: {
      address: '789 Pine St, City, State 12345',
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    description: 'Install new electrical outlets in living room',
    specialInstructions: 'Need 4 new outlets installed',
    status: 'in-progress',
    totalAmount: 285
  },
  {
    scheduledDate: '2024-01-30',
    scheduledTime: '08:00',
    duration: 5,
    location: {
      address: '321 Elm Dr, City, State 12345',
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    description: 'Complete garden redesign and planting',
    specialInstructions: 'Include new flower beds and pathway',
    status: 'pending',
    totalAmount: 375
  },
  {
    scheduledDate: '2024-02-05',
    scheduledTime: '10:00',
    duration: 6,
    location: {
      address: '654 Maple Blvd, City, State 12345',
      coordinates: [25.276987, 55.296233] // Business Bay, Dubai
    },
    description: 'Paint entire living room and dining area',
    specialInstructions: 'Use neutral colors, walls only',
    status: 'pending',
    totalAmount: 390
  }
];

const sampleChats = [
  {
    content: 'Hello! I need help with a plumbing issue. My kitchen sink is clogged.',
    type: 'user'
  },
  {
    content: 'Hi! I can help you with that. What type of clog are you experiencing?',
    type: 'bot'
  },
  {
    content: 'The water is backing up and not draining properly.',
    type: 'user'
  },
  {
    content: 'That sounds like a drain clog. I can connect you with a professional plumber who can help resolve this issue. Would you like me to show you available plumbing services?',
    type: 'bot'
  }
];

// Seed function
async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});
    await Chat.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      // Do NOT hash password here; let the pre-save hook handle it
      const user = new User({
        ...userData
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.email}`);
    }

    // Get user references
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const customerUsers = createdUsers.filter(u => u.role === 'customer');
    const providerUsers = createdUsers.filter(u => u.role === 'provider');

    // Create services
    const createdServices = [];
    for (let i = 0; i < sampleServices.length; i++) {
      const serviceData = sampleServices[i];
      const provider = providerUsers[i % providerUsers.length];
      
      const service = new Service({
        ...serviceData,
        provider: provider._id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        totalReviews: Math.floor(Math.random() * 50) + 10 // 10-60 reviews
      });
      
      const savedService = await service.save();
      createdServices.push(savedService);
      console.log(`Created service: ${savedService.name}`);
    }

    // Create bookings
    for (let i = 0; i < sampleBookings.length; i++) {
      const bookingData = sampleBookings[i];
      const customer = customerUsers[i % customerUsers.length];
      const service = createdServices[i % createdServices.length];
      const provider = service.provider;

      const booking = new Booking({
        ...bookingData,
        customer: customer._id,
        service: service._id,
        provider: provider
      });

      await booking.save();
      console.log(`Created booking: ${booking._id}`);
    }

    // Create chat messages
    for (const chatData of sampleChats) {
      const chat = new Chat({
        ...chatData,
        sender: chatData.type === 'user' ? customerUsers[0]._id : null
      });
      await chat.save();
    }

    console.log('Data seeding completed successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${createdServices.length} services`);
    console.log(`Created ${sampleBookings.length} bookings`);
    console.log(`Created ${sampleChats.length} chat messages`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedData(); 