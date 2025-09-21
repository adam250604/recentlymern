import { Link } from 'react-router-dom'
import FavoriteToggle from './FavoriteToggle'

export default function RecipeCard({ recipe, onToggleFavorite }) {
  return (
    <div className="card">
      <Link to={`/recipes/${recipe.id}`}>
        <img className="card-img" src={recipe.imageUrl} alt={recipe.title} />
      </Link>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 className="card-title" style={{ flex: 1 }}>{recipe.title}</h3>
          <FavoriteToggle active={!!recipe.isFavorite} onToggle={(state) => onToggleFavorite?.(recipe, state)} />
        </div>
        <div className="card-meta">Rating: {recipe.avgRating?.toFixed?.(1) ?? recipe.avgRating ?? 0}</div>
      </div>
    </div>
  )
}
