import express from 'express'
import mongoose from 'mongoose'
import { authRequired } from '../middleware/auth.js'
import User from '../models/User.js'
import Recipe from '../models/Recipe.js'
import Comment from '../models/Comment.js'

const router = express.Router()

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).lean()
    if (!u) return res.status(404).json({ message: 'Not found' })
    res.json({ id: String(u._id), name: u.name, email: u.email })
  } catch (e) { next(e) }
})

router.put('/me', authRequired, async (req, res, next) => {
  try {
    const u = await User.findByIdAndUpdate(req.user.id, { $set: { name: req.body.name, email: req.body.email } }, { new: true }).lean()
    if (!u) return res.status(404).json({ message: 'Not found' })
    res.json({ id: String(u._id), name: u.name, email: u.email })
  } catch (e) { next(e) }
})

function mapRecipe(doc, userId) {
  const favs = Array.isArray(doc.favorites) ? doc.favorites : []
  const isFav = userId ? favs.some((id) => String(id) === String(userId)) : false
  const ratingsMap = doc.ratings instanceof Map ? Object.fromEntries(doc.ratings) : (doc.ratings || {})
  const userRating = userId ? Number(ratingsMap[String(userId)] || 0) : 0
  return {
    id: String(doc._id),
    title: doc.title,
    imageUrl: doc.imageUrl,
    ingredients: doc.ingredients || [],
    instructions: doc.instructions || [],
    category: doc.category || '',
    cookingTime: doc.cookingTime ?? undefined,
    difficulty: doc.difficulty || undefined,
    avgRating: doc.avgRating ?? 0,
    isFavorite: isFav,
    userRating,
  }
}

router.get('/me/recipes', authRequired, async (req, res, next) => {
  try {
    const list = await Recipe.find({ ownerId: req.user.id }).lean()
    res.json({ items: list.map((doc) => mapRecipe(doc, req.user.id)) })
  } catch (e) { next(e) }
})

router.get('/me/favorites', authRequired, async (req, res, next) => {
  try {
    const list = await Recipe.find({ favorites: req.user.id }).lean()
    res.json({ items: list.map((doc) => mapRecipe(doc, req.user.id)) })
  } catch (e) { next(e) }
})

// Delete user account
router.delete('/me', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id
    
    // Delete all user's recipes
    await Recipe.deleteMany({ ownerId: userId })
    
    // Delete all user's comments
    await Comment.deleteMany({ user: userId })
    
    // Remove user from favorites in all recipes
    await Recipe.updateMany(
      { favorites: userId },
      { $pull: { favorites: userId } }
    )
    
    // Remove user's ratings from all recipes
    await Recipe.updateMany(
      {},
      { $unset: { [`ratings.${userId}`]: 1 } }
    )
    
    // Delete the user account
    await User.findByIdAndDelete(userId)
    
    res.json({ message: 'Account deleted successfully' })
  } catch (e) { 
    console.error('Delete account error:', e)
    next(e) 
  }
})

export default router
