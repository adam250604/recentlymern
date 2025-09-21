import express from 'express'
import { authRequired } from '../middleware/auth.js'
import Comment from '../models/Comment.js'

const router = express.Router()

// Get comments for a recipe
router.get('/recipe/:recipeId', async (req, res) => {
  const comments = await Comment.find({ recipe: req.params.recipeId }).populate('user', 'name email').sort({ createdAt: -1 })
  res.json(comments)
})

// Add a comment to a recipe
router.post('/recipe/:recipeId', authRequired, async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ message: 'Comment text required' })
  const comment = await Comment.create({
    recipe: req.params.recipeId,
    user: req.user.id,
    text
  })
  res.json(comment)
})

// Delete a comment
router.delete('/:id', authRequired, async (req, res) => {
  const comment = await Comment.findById(req.params.id)
  if (!comment) return res.status(404).json({ message: 'Comment not found' })
  if (String(comment.user) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' })
  await comment.deleteOne()
  res.json({ ok: true })
})

export default router
