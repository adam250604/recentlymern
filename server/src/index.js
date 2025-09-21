import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import recipeRoutes from './routes/recipes.js'
import userRoutes from './routes/users.js'
import commentRoutes from './routes/comments.js'
import { connectIfConfigured } from './utils/db.js'

dotenv.config({ path: '../server.env' })
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(helmet())
app.use(morgan('dev'))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin, credentials: true, allowedHeaders: ["Content-Type","Authorization"], methods: ["GET","POST","PUT","DELETE","OPTIONS"], optionsSuccessStatus: 200 }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// static for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/recipes', recipeRoutes)
app.use('/api/users', userRoutes)
app.use('/api/comments', commentRoutes)

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }))
// error handler
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({ message: err.message || 'Server error' })
})

const port = process.env.PORT || 8001

connectIfConfigured().finally(() => {
  app.listen(port, () => console.log(`API running on http://localhost:${port}`))
})

