import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import sharp from 'sharp'
import Joi from 'joi'
import { authRequired } from '../middleware/auth.js'
import Recipe from '../models/Recipe.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '..', '..', 'uploads')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

const createSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  category: Joi.string().allow(''),
  cookingTime: Joi.number().integer().min(0).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  ingredients: Joi.array().items(Joi.string()).optional(),
  instructions: Joi.array().items(Joi.string()).optional(),
  nutritionalInfo: Joi.object({
    calories: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional()
  }).optional(),
  'nutritionalInfo.calories': Joi.number().min(0).optional(),
  'nutritionalInfo.protein': Joi.number().min(0).optional(),
  'nutritionalInfo.fat': Joi.number().min(0).optional(),
  'nutritionalInfo.carbs': Joi.number().min(0).optional()
})
const updateSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  category: Joi.string().allow('').optional(),
  cookingTime: Joi.number().integer().min(0).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  ingredients: Joi.array().items(Joi.string()).optional(),
  instructions: Joi.array().items(Joi.string()).optional(),
  nutritionalInfo: Joi.object({
    calories: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional()
  }).optional(),
  'nutritionalInfo.calories': Joi.number().min(0).optional(),
  'nutritionalInfo.protein': Joi.number().min(0).optional(),
  'nutritionalInfo.fat': Joi.number().min(0).optional(),
  'nutritionalInfo.carbs': Joi.number().min(0).optional()
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
    thumbUrl: doc.thumbUrl,
    ingredients: doc.ingredients || [],
    instructions: doc.instructions || [],
    category: doc.category || '',
    cookingTime: doc.cookingTime ?? undefined,
    difficulty: doc.difficulty || undefined,
    nutritionalInfo: doc.nutritionalInfo || {},
    avgRating: doc.avgRating ?? 0,
    isFavorite: isFav,
    userRating,
  }
}

function recomputeAvgFromMap(ratings) {
  const values = ratings instanceof Map ? Array.from(ratings.values()) : Object.values(ratings || {})
  if (!values.length) return 0
  const sum = values.reduce((a, b) => a + Number(b || 0), 0)
  return sum / values.length
}

async function processImage(file) {
  if (!file) return { imageUrl: undefined, thumbUrl: undefined }
  const full = path.join('/uploads', file.filename)
  const thumbName = file.filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') + '-thumb.jpg'
  const thumbFsPath = path.join(path.dirname(file.path), thumbName)
  try {
    await sharp(file.path).resize(480).jpeg({ quality: 78 }).toFile(thumbFsPath)
    const thumb = path.join('/uploads', thumbName)
    return { imageUrl: full, thumbUrl: thumb }
  } catch (e) {
    console.error('Image process error:', e.message)
    return { imageUrl: full, thumbUrl: full }
  }
}

function readArrayFields(body, key) {
  // Accept both form-data style key[index] and JSON arrays
  const arrFromKeys = Object.keys(body).filter(k => k.startsWith(`${key}[`)).map(k => body[k]).filter(Boolean)
  if (arrFromKeys.length) return arrFromKeys
  if (Array.isArray(body[key])) return body[key].filter(Boolean)
  return []
}

router.get('/', async (req, res, next) => {
  try {
    const { q, category, sort } = req.query
    const filter = {}
    if (q) {
      const regex = new RegExp(String(q), 'i')
      filter.$or = [{ title: regex }, { ingredients: regex }]
    }
    if (category) filter.category = category

    let list = await Recipe.find(filter).lean()

    if (sort === 'rating') list.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    else if (sort === 'popular') list.sort((a, b) => (b.favorites?.length || 0) - (a.favorites?.length || 0))
    else list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    const userId = req.headers.authorization ? (() => { try { return JSON.parse(Buffer.from(req.headers.authorization.split('.')[1] || 'e30=', 'base64').toString()).id } catch { return null } })() : null

    const items = list.map((doc) => mapRecipe(doc, userId))
    res.json({ items })
  } catch (e) { next(e) }
})

router.get('/recommendations', authRequired, async (req, res, next) => {
  try {
    // Get user's favorite categories and high-rated recipes
    const userRecipes = await Recipe.find({ ownerId: req.user.id }).lean()
    const userFavorites = await Recipe.find({ favorites: req.user.id }).lean()
    
    // Get categories from user's recipes and favorites
    const userCategories = [...new Set([
      ...userRecipes.map(r => r.category).filter(Boolean),
      ...userFavorites.map(r => r.category).filter(Boolean)
    ])]
    
    // Find recipes in similar categories, excluding user's own recipes
    const recommendations = await Recipe.find({
      ownerId: { $ne: req.user.id },
      category: { $in: userCategories }
    }).sort({ avgRating: -1, createdAt: -1 }).limit(6).lean()
    
    const userId = req.user.id
    const items = recommendations.map((doc) => mapRecipe(doc, userId))
    res.json(items)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const doc = await Recipe.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    const userId = req.headers.authorization ? (() => { try { return JSON.parse(Buffer.from(req.headers.authorization.split('.')[1] || 'e30=', 'base64').toString()).id } catch { return null } })() : null
    res.json(mapRecipe(doc, userId))
  } catch (e) { next(e) }
})

// Accept multipart and JSON fallback
router.post('/', authRequired, (req, res, next) => {
  // Decide middleware based on content type
  const ct = (req.headers['content-type'] || '').toLowerCase()
  if (ct.includes('multipart/form-data')) {
    upload.single('image')(req, res, (err) => {
      if (err) return next(err)
      return createHandler(req, res, next)
    })
  } else {
    return createHandler(req, res, next)
  }
})

async function createHandler(req, res, next) {
  try {
    console.log('Recipe creation request body:', req.body)
    const { value, error } = createSchema.validate(req.body)
    if (error) {
      console.log('Validation error:', error.message)
      return res.status(400).json({ message: error.message })
    }

    const ingredients = readArrayFields(req.body, 'ingredients')
    const instructions = readArrayFields(req.body, 'instructions')

    // Parse nutritional information from FormData
    const nutritionalInfo = {}
    if (req.body['nutritionalInfo.calories']) {
      nutritionalInfo.calories = Number(req.body['nutritionalInfo.calories'])
    }
    if (req.body['nutritionalInfo.protein']) {
      nutritionalInfo.protein = Number(req.body['nutritionalInfo.protein'])
    }
    if (req.body['nutritionalInfo.fat']) {
      nutritionalInfo.fat = Number(req.body['nutritionalInfo.fat'])
    }
    if (req.body['nutritionalInfo.carbs']) {
      nutritionalInfo.carbs = Number(req.body['nutritionalInfo.carbs'])
    }

    const { imageUrl, thumbUrl } = await processImage(req.file)

    const doc = await Recipe.create({
      title: value.title,
      category: value.category || '',
      cookingTime: value.cookingTime,
      difficulty: value.difficulty,
      ingredients,
      instructions,
      nutritionalInfo: Object.keys(nutritionalInfo).length > 0 ? nutritionalInfo : (value.nutritionalInfo || {}),
      imageUrl: imageUrl || 'https://picsum.photos/800/600',
      thumbUrl: thumbUrl || imageUrl,
      avgRating: 0,
      ownerId: req.user.id,
      favorites: [],
      ratings: {},
    })
    res.json({ id: String(doc._id) })
  } catch (e) {
    console.error('Create recipe error:', e)
    res.status(500).json({ message: 'Failed to create recipe', detail: e.message })
  }
}

router.put('/:id', authRequired, (req, res, next) => {
  const ct = (req.headers['content-type'] || '').toLowerCase()
  if (ct.includes('multipart/form-data')) {
    upload.single('image')(req, res, (err) => {
      if (err) return next(err)
      return updateHandler(req, res, next)
    })
  } else {
    return updateHandler(req, res, next)
  }
})

async function updateHandler(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const doc = await Recipe.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    if (String(doc.ownerId || '') !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' })

    const { value, error } = updateSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.message })

    const ingredients = readArrayFields(req.body, 'ingredients')
    const instructions = readArrayFields(req.body, 'instructions')

    // Parse nutritional information from FormData
    const nutritionalInfo = {}
    if (req.body['nutritionalInfo.calories']) {
      nutritionalInfo.calories = Number(req.body['nutritionalInfo.calories'])
    }
    if (req.body['nutritionalInfo.protein']) {
      nutritionalInfo.protein = Number(req.body['nutritionalInfo.protein'])
    }
    if (req.body['nutritionalInfo.fat']) {
      nutritionalInfo.fat = Number(req.body['nutritionalInfo.fat'])
    }
    if (req.body['nutritionalInfo.carbs']) {
      nutritionalInfo.carbs = Number(req.body['nutritionalInfo.carbs'])
    }

    if (value.title !== undefined) doc.title = value.title
    if (value.category !== undefined) doc.category = value.category
    if (value.cookingTime !== undefined) doc.cookingTime = value.cookingTime
    if (value.difficulty !== undefined) doc.difficulty = value.difficulty
    if (ingredients.length) doc.ingredients = ingredients
    if (instructions.length) doc.instructions = instructions
    if (Object.keys(nutritionalInfo).length > 0) {
      doc.nutritionalInfo = nutritionalInfo
    } else if (value.nutritionalInfo !== undefined) {
      doc.nutritionalInfo = value.nutritionalInfo
    }

    if (req.file) {
      const { imageUrl, thumbUrl } = await processImage(req.file)
      if (imageUrl) doc.imageUrl = imageUrl
      if (thumbUrl) doc.thumbUrl = thumbUrl
    }

    await doc.save()
    res.json(mapRecipe(doc, req.user.id))
  } catch (e) {
    console.error('Update recipe error:', e)
    res.status(500).json({ message: 'Failed to update recipe', detail: e.message })
  }
}

router.post('/:id/favorite', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const userId = req.user.id
    await Recipe.findByIdAndUpdate(req.params.id, { $addToSet: { favorites: userId } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.delete('/:id/favorite', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const userId = req.user.id
    await Recipe.findByIdAndUpdate(req.params.id, { $pull: { favorites: userId } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/:id/rating', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const value = Number(req.body.value)
    if (!(value >= 1 && value <= 5)) return res.status(400).json({ message: 'Rating must be 1-5' })

    const doc = await Recipe.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })

    if (doc.ratings instanceof Map) {
      doc.ratings.set(String(req.user.id), value)
    } else {
      doc.ratings = { ...(doc.ratings || {}), [String(req.user.id)]: value }
    }
    doc.avgRating = recomputeAvgFromMap(doc.ratings)
    await doc.save()
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
