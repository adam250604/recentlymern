import express from 'express'
import Joi from 'joi'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { issueToken } from '../middleware/auth.js'
import User from '../models/User.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js'

const router = express.Router()

const registerSchema = Joi.object({ name: Joi.string().min(2).max(100).required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() })
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() })
const resetPasswordSchema = Joi.object({ email: Joi.string().email().required() })
const confirmResetSchema = Joi.object({ token: Joi.string().required(), password: Joi.string().min(6).required() })
const verifyEmailSchema = Joi.object({ token: Joi.string().required() })

router.post('/register', async (req, res, next) => {
  try {
    const { value, error } = registerSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })
    const exists = await User.findOne({ email: value.email.toLowerCase() })
    if (exists) return res.status(400).json({ message: 'Email already in use' })
    
    const passwordHash = await bcrypt.hash(value.password, 10)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const user = await User.create({ 
      name: value.name, 
      email: value.email.toLowerCase(), 
      passwordHash,
      emailVerificationToken,
      emailVerificationExpires
    })
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, emailVerificationToken)
    if (!emailSent) {
      console.warn('Failed to send verification email to:', user.email)
    }
    
    const token = issueToken({ id: String(user._id), email: user.email, name: user.name })
    res.json({ 
      token, 
      user: { id: String(user._id), name: user.name, email: user.email, isEmailVerified: false },
      message: 'Registration successful! Please check your email to verify your account.'
    })
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
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. Check your inbox for a verification link.',
        requiresVerification: true 
      })
    }
    
    const token = issueToken({ id: String(user._id), email: user.email, name: user.name })
    res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } })
  } catch (e) { next(e) }
})

// Email verification
router.post('/verify-email', async (req, res, next) => {
  try {
    const { value, error } = verifyEmailSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })
    
    const user = await User.findOne({ 
      emailVerificationToken: value.token,
      emailVerificationExpires: { $gt: new Date() }
    })
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' })
    
    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()
    
    res.json({ message: 'Email verified successfully!' })
  } catch (e) { next(e) }
})

// Resend verification email
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' })
    }
    
    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    user.emailVerificationToken = emailVerificationToken
    user.emailVerificationExpires = emailVerificationExpires
    await user.save()
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, emailVerificationToken)
    if (!emailSent) {
      console.warn('Failed to send verification email to:', user.email)
      return res.status(500).json({ message: 'Failed to send verification email' })
    }
    
    res.json({ message: 'Verification email sent successfully!' })
  } catch (e) { next(e) }
})

// Request password reset
router.post('/reset-password/request', async (req, res, next) => {
  try {
    const { value, error } = resetPasswordSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })
    
    const user = await User.findOne({ email: value.email.toLowerCase() })
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()
    
    const emailSent = await sendPasswordResetEmail(user.email, resetToken)
    if (!emailSent) {
      console.warn('Failed to send password reset email to:', user.email)
    }
    
    res.json({ message: 'Password reset email sent!' })
  } catch (e) { next(e) }
})

// Confirm password reset
router.post('/reset-password/confirm', async (req, res, next) => {
  try {
    const { value, error } = confirmResetSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })
    
    const user = await User.findOne({ 
      resetPasswordToken: value.token,
      resetPasswordExpires: { $gt: new Date() }
    })
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' })
    
    const passwordHash = await bcrypt.hash(value.password, 10)
    user.passwordHash = passwordHash
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    
    res.json({ message: 'Password reset successfully!' })
  } catch (e) { next(e) }
})

export default router
