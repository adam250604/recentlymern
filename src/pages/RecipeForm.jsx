import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { toast } from 'react-toastify'

export default function RecipeForm({ mode }) {
  const [cookingTime, setCookingTime] = useState('')
  const [difficulty, setDifficulty] = useState('easy')
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = mode === 'edit'
  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState([''])
  const [instructions, setInstructions] = useState([''])
  const [imageFile, setImageFile] = useState(null)
  const [category, setCategory] = useState('')
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: '',
    protein: '',
    fat: '',
    carbs: ''
  })

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/recipes/${id}`).then(({ data }) => {
        setTitle(data.title || '')
        setIngredients(data.ingredients || [''])
        setInstructions(data.instructions || [''])
        setCategory(data.category || '')
        setCookingTime(data.cookingTime ?? '')
        setDifficulty(data.difficulty || 'easy')
        setNutritionalInfo(data.nutritionalInfo || { calories: '', protein: '', fat: '', carbs: '' })
      })
    }
  }, [isEdit, id])

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log('Form data before submission:', { title, category, cookingTime, difficulty, ingredients, instructions, nutritionalInfo })
      
      const form = new FormData()
      form.append('title', title)
      form.append('category', category)
      // Only send cookingTime if it's a valid number
      if (cookingTime !== '' && !isNaN(Number(cookingTime))) {
        form.append('cookingTime', Number(cookingTime))
      }
      // Always send a valid difficulty
      form.append('difficulty', ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy')
      // Filter out empty ingredients/instructions
      ingredients.filter(v => v && v.trim()).forEach((v, idx) => form.append(`ingredients[${idx}]`, v))
      instructions.filter(v => v && v.trim()).forEach((v, idx) => form.append(`instructions[${idx}]`, v))
      
      // Add nutritional information
      const nutritionData = {}
      if (nutritionalInfo.calories && !isNaN(Number(nutritionalInfo.calories))) {
        nutritionData.calories = Number(nutritionalInfo.calories)
      }
      if (nutritionalInfo.protein && !isNaN(Number(nutritionalInfo.protein))) {
        nutritionData.protein = Number(nutritionalInfo.protein)
      }
      if (nutritionalInfo.fat && !isNaN(Number(nutritionalInfo.fat))) {
        nutritionData.fat = Number(nutritionalInfo.fat)
      }
      if (nutritionalInfo.carbs && !isNaN(Number(nutritionalInfo.carbs))) {
        nutritionData.carbs = Number(nutritionalInfo.carbs)
      }
      if (Object.keys(nutritionData).length > 0) {
        // Send each nutritional field separately for FormData
        Object.keys(nutritionData).forEach(key => {
          form.append(`nutritionalInfo.${key}`, nutritionData[key])
        })
      }
      
      if (imageFile) form.append('image', imageFile)
      
      console.log('FormData contents:')
      for (let [key, value] of form.entries()) {
        console.log(key, value)
      }

      if (isEdit) {
        await api.put(`/recipes/${id}`, form)
        toast.success('Recipe updated')
        navigate(`/recipes/${id}`)
      } else {
        const { data } = await api.post('/recipes', form)
        toast.success('Recipe created')
        navigate(`/recipes/${data.id || ''}`)
      }
    } catch (e2) {
      console.error('Recipe save error:', e2)
      const errorMessage = e2.response?.data?.message || 'Failed to save recipe'
      toast.error(errorMessage)
    }
  }

  const updateList = (setter) => (idx, value) => {
    setter((arr) => arr.map((v, i) => (i === idx ? value : v)))
  }
  const addItem = (setter) => () => setter((arr) => [...arr, ''])
  const removeItem = (setter) => (idx) => setter((arr) => arr.filter((_, i) => i !== idx))

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 700, margin: '0 auto' }}>
      <h2>{isEdit ? 'Edit' : 'New'} Recipe</h2>
      <label>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label>Category</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select a category</option>
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
      </select>

      <label>Cooking Time (minutes)</label>
      <input type="number" min="0" value={cookingTime} onChange={e => setCookingTime(e.target.value)} placeholder="e.g. 30" />

      <label>Difficulty</label>
      <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <label>Ingredients</label>
      {ingredients.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <input value={v} onChange={(e) => updateList(setIngredients)(i, e.target.value)} />
          <button type="button" onClick={() => removeItem(setIngredients)(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem(setIngredients)}>
        Add Ingredient
      </button>

      <label>Instructions</label>
      {instructions.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <input value={v} onChange={(e) => updateList(setInstructions)(i, e.target.value)} />
          <button type="button" onClick={() => removeItem(setInstructions)(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem(setInstructions)}>
        Add Step
      </button>

      <label>Image</label>
      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

      <h3>Nutritional Information (Optional)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>Calories</label>
          <input 
            type="number" 
            min="0" 
            value={nutritionalInfo.calories} 
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, calories: e.target.value }))} 
            placeholder="e.g. 250"
          />
        </div>
        <div>
          <label>Protein (g)</label>
          <input 
            type="number" 
            min="0" 
            value={nutritionalInfo.protein} 
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, protein: e.target.value }))} 
            placeholder="e.g. 15"
          />
        </div>
        <div>
          <label>Fat (g)</label>
          <input 
            type="number" 
            min="0" 
            value={nutritionalInfo.fat} 
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, fat: e.target.value }))} 
            placeholder="e.g. 8"
          />
        </div>
        <div>
          <label>Carbs (g)</label>
          <input 
            type="number" 
            min="0" 
            value={nutritionalInfo.carbs} 
            onChange={(e) => setNutritionalInfo(prev => ({ ...prev, carbs: e.target.value }))} 
            placeholder="e.g. 30"
          />
        </div>
      </div>

      <button type="submit">{isEdit ? 'Update' : 'Create'}</button>
    </form>
  )
}
