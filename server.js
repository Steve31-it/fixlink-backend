const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Load .env variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ CORS setup for local + deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://fixlink-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// ✅ Root route
app.get('/', (req, res) => {
  res.send('FixLink API is running...');
});

// ✅ Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
