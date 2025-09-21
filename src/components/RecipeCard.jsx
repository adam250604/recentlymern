import { Link } from 'react-router-dom'
import FavoriteToggle from './FavoriteToggle'
import Rating from './Rating'

export default function RecipeCard({ recipe, onToggleFavorite, onRate, showRating = true }) {
  return (
    <div className="card">
      <Link to={`/recipes/${recipe.id}`}>
        <img className="card-img" src={recipe.imageUrl} alt={recipe.title} />
      </Link>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={`/recipes/${recipe.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
            <h3 className="card-title" style={{ margin: 0, cursor: 'pointer' }}>{recipe.title}</h3>
          </Link>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteToggle active={!!recipe.isFavorite} onToggle={(state) => onToggleFavorite?.(recipe, state)} />
          </div>
        </div>
        <div className="card-meta">
          <div>Rating: {recipe.avgRating?.toFixed?.(1) ?? recipe.avgRating ?? 0}</div>
          {showRating && onRate && (
            <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
              <Rating value={recipe.userRating || 0} onChange={(value) => onRate(recipe, value)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
