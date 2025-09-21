import express from 'express'
import Joi from 'joi'
import bcrypt from 'bcryptjs'
import { issueToken } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

const registerSchema = Joi.object({ name: Joi.string().min(2).max(100).required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() })
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() })

router.post('/register', async (req, res, next) => {
  try {
    const { value, error } = registerSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })
    const exists = await User.findOne({ email: value.email.toLowerCase() })
    if (exists) return res.status(400).json({ message: 'Email already in use' })
    const passwordHash = await bcrypt.hash(value.password, 10)
    const user = await User.create({ name: value.name, email: value.email.toLowerCase(), passwordHash })
    const token = issueToken({ id: String(user._id), email: user.email, name: user.name })
    res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } })
  } catch (e) { next(e) }
})

router.post('/login', async (req, res, next) => {
  try {
    const { value, error } = loginSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })
    const user = await User.findOne({ email: value.email.toLowerCase() })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(value.password, user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = issueToken({ id: String(user._id), email: user.email, name: user.name })
    res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } })
  } catch (e) { next(e) }
})

router.post('/reset-password', async (req, res) => { res.json({ ok: true }) })

export default router
