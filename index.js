import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './Config/connectDB.js';
import userRouter from './Routes/user.route.js';
import feedRoutes from './Routes/feed.route.js';
import followRouter from './Routes/follow.route.js';
import aiTweetRouter from './Routes/aiTweets.route.js';
import storyRouter from './Routes/story.route.js';

// 🧩 Added imports for chat system
import { createServer } from 'http';
import { initializeSocket } from './Services/socket.js'; // ✅ updated import
import chatRoutes from './Routes/chat.routes.js';
import messageRoutes from './Routes/message.routes.js';

dotenv.config();

const app = express();

// === MIDDLEWARE ===

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// === ROUTES ===

// Test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running 🚀' });
});

// API routes
app.use('/api/users', userRouter);
app.use('/api', feedRoutes);
app.use('/api', followRouter);
app.use('/api/ai', aiTweetRouter);
app.use('/api/story', storyRouter);

// 🧩 Added Chat & Message routes
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// === DATABASE & SERVER ===
const PORT = process.env.PORT || 8080

// Create HTTP server for Socket.io
const server = createServer(app);

// 🧩 Initialize Socket.io with proper setup
const io = initializeSocket(server); // ✅ uses your new function that returns io
app.set('io', io); // ✅ allows controllers to emit events using req.app.get("io")

console.log('💬 Chat socket initialized');

// Connect DB and start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  });

export default app;
