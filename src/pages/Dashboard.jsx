import { useEffect, useState } from 'react'
import api from '../api/axios'
import RecipeCard from '../components/RecipeCard'
import Loader from '../components/Loader'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function Dashboard() {
  const [own, setOwn] = useState([])
  const [favorites, setFavorites] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [ownRes, favRes, recRes] = await Promise.all([
        api.get('/users/me/recipes'),
        api.get('/users/me/favorites'),
        api.get('/recipes/recommendations'),
      ])
      setOwn(ownRes.data.items || ownRes.data || [])
      setFavorites(favRes.data.items || favRes.data || [])
      setRecommendations(recRes.data || [])
    } catch (e) {
      toast.error('Failed to load dashboard')
    }
    setLoading(false)
  }

  const toggleFavorite = async (recipe, nextState) => {
    try {
      if (nextState) {
        await api.post(`/recipes/${recipe.id}/favorite`)
      } else {
        await api.delete(`/recipes/${recipe.id}/favorite`)
      }
      // Update all recipe lists
      setOwn((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: nextState } : r)))
      setFavorites((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: nextState } : r)))
      setRecommendations((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, isFavorite: nextState } : r)))
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const rateRecipe = async (recipe, value) => {
    try {
      await api.post(`/recipes/${recipe.id}/rating`, { value })
      toast.success('Thanks for rating!')
      // Update all recipe lists
      const updateRecipe = (r) => r.id === recipe.id ? { ...r, userRating: value, avgRating: (r.avgRating + value) / 2 } : r
      setOwn((prev) => prev.map(updateRecipe))
      setFavorites((prev) => prev.map(updateRecipe))
      setRecommendations((prev) => prev.map(updateRecipe))
    } catch {
      toast.error('Failed to rate recipe')
    }
  }
  useEffect(() => {
    load()
  }, [])

  if (loading) return <Loader />

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ flex: 1 }}>My Recipes</h2>
        <Link to="/recipes/new">+ New Recipe</Link>
      </div>
      <div className="responsive-grid">
        {own.map((r) => (
          <RecipeCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} onRate={rateRecipe} showRating={false} />
        ))}
      </div>
      <h2>Favorites</h2>
      <div className="responsive-grid">
        {favorites.map((r) => (
          <RecipeCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} onRate={rateRecipe} />
        ))}
      </div>
      <h2>Recommended for You</h2>
      <div className="responsive-grid">
        {recommendations.length === 0 ? <div>No recommendations yet.</div> : recommendations.map((r) => (
          <RecipeCard key={r.id} recipe={r} onToggleFavorite={toggleFavorite} onRate={rateRecipe} />
        ))}
      </div>
    </div>
  )
}
