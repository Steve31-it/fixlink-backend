# MongoDB Data Setup Guide

This guide will help you populate your FixLink application with sample data for testing and development.

## 📋 Prerequisites

1. Make sure your MongoDB connection is properly configured in `.env`
2. Ensure all dependencies are installed: `npm install`
3. The backend server should be able to connect to MongoDB

## 🚀 Quick Start

### 1. Run the Data Seeding Script

```bash
cd backend
npm run seed
```

This will:
- Clear all existing data from the database
- Create sample users (admin, customers, providers)
- Create sample services
- Create sample bookings
- Create sample chat messages

### 2. Sample Login Credentials

After running the seed script, you can use these credentials to test the application:

#### Admin User
- **Email:** admin@fixlink.com
- **Password:** admin123
- **Role:** Admin (full access to all features)

#### Customer Users
- **Email:** john@example.com
- **Password:** password123
- **Role:** Customer

- **Email:** sarah@example.com
- **Password:** password123
- **Role:** Customer

- **Email:** mike@example.com
- **Password:** password123
- **Role:** Customer

#### Provider Users
- **Email:** david@example.com
- **Password:** password123
- **Role:** Provider (Plumbing specialist)

- **Email:** lisa@example.com
- **Password:** password123
- **Role:** Provider (Cleaning specialist)

- **Email:** robert@example.com
- **Password:** password123
- **Role:** Provider (Electrical specialist)

- **Email:** emma@example.com
- **Password:** password123
- **Role:** Provider (Gardening specialist)

- **Email:** james@example.com
- **Password:** password123
- **Role:** Provider (Painting specialist)

- **Email:** maria@example.com
- **Password:** password123
- **Role:** Provider (Carpentry specialist)

## 📊 Sample Data Overview

### Users Created
- **1 Admin user** - Full system access
- **3 Customer users** - Can book services
- **6 Provider users** - Can offer services

### Services Created
- **10 different services** across all categories:
  - Plumbing (Emergency Repair, Drain Cleaning)
  - Cleaning (House Cleaning, Office Cleaning)
  - Electrical (Installation, Ceiling Fan)
  - Landscaping (Garden Design, Lawn Maintenance)
  - Painting (Interior Painting)
  - Carpentry (Cabinet Installation)

### Bookings Created
- **5 sample bookings** with different statuses:
  - Completed
  - Confirmed
  - In Progress
  - Pending

### Chat Messages
- **4 sample chat messages** for testing the chatbot feature

## 🔧 Customizing Sample Data

To modify the sample data, edit the `seedData.js` file:

1. **Add more users:** Modify the `sampleUsers` array
2. **Add more services:** Modify the `sampleServices` array
3. **Add more bookings:** Modify the `sampleBookings` array
4. **Add more chat messages:** Modify the `sampleChats` array

## 🗑️ Clearing Data

To clear all data and start fresh:

```bash
npm run seed
```

This will delete all existing data and recreate the sample data.

## 🔍 Testing Different User Roles

### Admin Testing
1. Login as `admin@fixlink.com`
2. Access the Admin dashboard
3. View all users, services, and bookings
4. Test user management features

### Customer Testing
1. Login as any customer user
2. Browse available services
3. Book a service
4. View booking history
5. Chat with support

### Provider Testing
1. Login as any provider user
2. View "My Services" page
3. Create new services
4. Manage existing services
5. View incoming bookings

## 🚨 Important Notes

- **Passwords are hashed** using bcrypt for security
- **All users are active** by default
- **Services have realistic pricing** and descriptions
- **Bookings have different statuses** for testing workflow
- **Data is interconnected** - bookings reference real users and services

## 🐛 Troubleshooting

### Connection Issues
- Ensure MongoDB is running
- Check your `.env` file has correct `MONGODB_URI`
- Verify network connectivity

### Data Not Appearing
- Check console output for errors
- Ensure all models are properly imported
- Verify database permissions

### Permission Errors
- Ensure your MongoDB user has read/write permissions
- Check if the database exists and is accessible

## 📝 Next Steps

After seeding the data:

1. **Start the backend server:** `npm start`
2. **Start the frontend:** `cd ../frontend && npm run dev`
3. **Test the application** with the provided credentials
4. **Explore all features** with the sample data

Happy testing! 🎉 