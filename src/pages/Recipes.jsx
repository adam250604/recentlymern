import { useEffect, useState } from 'react'
import api from '../api/axios'
import RecipeCard from '../components/RecipeCard'
import SearchBar from '../components/SearchBar'
import Filters from '../components/Filters'
import Loader from '../components/Loader'
import { toast } from 'react-toastify'

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState('recent')
  const [loading, setLoading] = useState(false)

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/recipes', { params: { q, ...filters, sort } })
      setRecipes(data.items || data || [])
    } catch (e) {
      toast.error('Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters, sort])

  const toggleFavorite = async (recipe, nextState) => {
    try {
      if (nextState) {
        await api.post(`/recipes/${recipe.id}/favorite`)
      } else {
        await api.delete(`/recipes/${recipe.id}/favorite`)
      }
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: nextState } : r)))
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <SearchBar value={q} onChange={setQ} />
        <Filters filters={filters} onChange={setFilters} sorting={sort} onSortChange={setSort} />
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div className="grid">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  )
}
