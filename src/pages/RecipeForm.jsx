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

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/recipes/${id}`).then(({ data }) => {
        setTitle(data.title || '')
        setIngredients(data.ingredients || [''])
        setInstructions(data.instructions || [''])
        setCategory(data.category || '')
        setCookingTime(data.cookingTime ?? '')
        setDifficulty(data.difficulty || 'easy')
      })
    }
  }, [isEdit, id])

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
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
      if (imageFile) form.append('image', imageFile)

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
      toast.error('Failed to save recipe')
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

      <button type="submit">{isEdit ? 'Update' : 'Create'}</button>
    </form>
  )
}
