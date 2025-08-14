import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import ActivityLog from './models/ActivityLog.js';
import authRouter from './routes/auth.js';
import productRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import cartRouter from './routes/cart.js';
import wishlistRouter from './routes/wishlist.js';
import reviewsRouter from './routes/reviews.js';
import paymentsRouter from './routes/payments.js';
import metricsRouter from './routes/metrics.js';
import discountsRouter from './routes/discounts.js';
import referralsRouter from './routes/referrals.js';
import adminRouter from './routes/admin.js';
import { seedProducts } from './util/seed.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET','POST'] }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safeshop';

// DB
mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(async () => {
  await seedProducts();
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error', err);
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// Admin activity logger (non-GET authenticated requests)
app.use(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const hasBearer = header.startsWith('Bearer ');
  // Do not import auth middleware here; this is a best-effort logger
  if (req.method !== 'GET' && hasBearer) {
    try {
      const jwt = await import('jsonwebtoken');
      const payload = jwt.default.verify(header.slice(7), process.env.JWT_SECRET || 'dev_secret');
      if (payload?.id) {
        ActivityLog.create({ userId: payload.id, action: `${req.method} ${req.path}`.slice(0,120), ip: req.ip, meta: { query: req.query, body: req.body } }).catch(()=>{})
      }
    } catch {}
  }
  next();
});

// Swagger OpenAPI
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'SafeShop API', version: '1.0.0' },
    servers: [{ url: process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/:\\d+$/, ':5000') + '/api' : 'http://localhost:5000/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/openapi.json', (req, res) => res.json(swaggerSpec));

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/discounts', discountsRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/admin', adminRouter);

// WebSocket - simple chat placeholder
io.on('connection', (socket) => {
  socket.on('join', (room) => socket.join(room));
  socket.on('message', ({ room, message, user }) => {
    io.to(room).emit('message', { message, user, ts: Date.now() });
  });
});

server.listen(PORT, () => console.log(`API listening on :${PORT}`));
