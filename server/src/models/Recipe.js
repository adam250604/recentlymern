import mongoose from 'mongoose'

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    category: { type: String, index: true },
    cookingTime: { type: Number, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy', index: true },
    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },
    imageUrl: String,
    thumbUrl: String,
    nutritionalInfo: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 }
    },
    avgRating: { type: Number, default: 0, index: true },
    ratings: { type: Map, of: Number, default: {} },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
)

// Text index for title and ingredients
recipeSchema.index({ title: 'text', ingredients: 'text' })

export default mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema)
