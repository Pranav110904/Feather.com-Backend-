import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './Config/connectDB.js';
import  userRouter  from './Routes/user.route.js';

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
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// === ROUTES ===

// Test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running 🚀' });
});

// API routes
app.use('/api/users', userRouter); // Example user routes

// === DATABASE & SERVER ===
const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  });

export default app;




// import express from 'express'
// import cors from 'cors'
// import dotenv from 'dotenv'


// dotenv.config()
// import cookieParser from 'cookie-parser'
// import morgan from 'morgan'
// import helmet from 'helmet'
// import connectDB from './Config/connectDB.js'
// //import userRouter from './Routes/user.route.js'

// const app = express()

// app.use(cors({
//     credentials: true,
//     origin : 'http://localhost:3000'
// }))



// app.use(express.json())
// app.use(cookieParser())
// app.use(morgan('dev'))
// app.use(helmet(
//     {
//         crossOriginResourcePolicy: false,
//     }
// ))

// const PORT = 8080 || process.env.PORT


// app.get('/', (req, res) => {
//     res.send({
//         message: "server is running"
// })
// })


// // define all sort of routes over here




// //app.use('/api/user',userRouter)

// connectDB().then(() => {
//     app.listen(PORT , ()=> {
//     console.log(`server is running on port ${PORT}`)
// })
// })

