import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/axios'
import Loader from '../components/Loader'
import Rating from '../components/Rating'
import FavoriteToggle from '../components/FavoriteToggle'
import ErrorMessage from '../components/ErrorMessage'
import RecipeCard from '../components/RecipeCard'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function RecipeDetail() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const navigate = useNavigate()

  const fetchRecipe = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/recipes/${id}`)
      setRecipe(data)
    } catch {
      toast.error('Failed to load recipe')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchRecipe()
    fetchComments()
    fetchRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchRecommendations = async () => {
    try {
      const { data } = await api.get('/recipes/recommendations')
      setRecommendations(data)
    } catch {
      setRecommendations([])
    }
  }

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const { data } = await api.get(`/comments/recipe/${id}`)
      setComments(data)
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const onRate = async (value) => {
    try {
      await api.post(`/recipes/${id}/rating`, { value })
      toast.success('Thanks for rating!')
      fetchRecipe()
    } catch {
      toast.error('Failed to rate')
    }
  }

  const onToggleFavorite = async (next) => {
    try {
      if (next) await api.post(`/recipes/${id}/favorite`)
      else await api.delete(`/recipes/${id}/favorite`)
      setRecipe((r) => ({ ...r, isFavorite: next }))
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  if (loading || !recipe) return <Loader />
  // Share URLs
  const recipeUrl = window.location.href
  const shareText = `Check out this recipe: ${recipe?.title}`
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recipeUrl)}`
  const twitterShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(recipeUrl)}&text=${encodeURIComponent(shareText)}`
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + recipeUrl)}`

  const handleWebShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe?.title,
        text: shareText,
        url: recipeUrl,
      })
    } else {
      toast.info('Web Share API not supported on this device.')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 900, margin: '0 auto' }}>
      <img src={recipe.imageUrl} alt={recipe.title} style={{ width: '100%', borderRadius: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, flex: 1 }}>{recipe.title}</h2>
        <FavoriteToggle active={!!recipe.isFavorite} onToggle={onToggleFavorite} />
        {isAuthenticated && <Link to={`/recipes/${id}/edit`}>Edit</Link>}
      </div>

      {/* Recommended Recipes */}
      <div>
        <h3>Recommended Recipes</h3>
          <div className="responsive-grid">
          {recommendations.length === 0 ? <div>No recommendations yet.</div> : recommendations.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </div>
      <div>Average rating: {recipe.avgRating ?? 0}</div>

      {/* Share Buttons */}
      <div style={{ margin: '8px 0' }}>
        <h3>Share this recipe</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={facebookShare} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#4267B2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Facebook</button>
          </a>
          <a href={twitterShare} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#1DA1F2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Twitter</button>
          </a>
          <a href={whatsappShare} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>WhatsApp</button>
          </a>
          <button onClick={handleWebShare} style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Share...</button>
        </div>
      </div>
      <div>
        <h3>Ingredients</h3>
        <ul>{(recipe.ingredients || []).map((ing, i) => <li key={i}>{ing}</li>)}</ul>

        {/* Shopping List Generator */}
        <div style={{ marginTop: 8 }}>
          <h4>Shopping List</h4>
          <ul style={{ background: '#f8f8f8', borderRadius: 6, padding: 12, listStyle: 'disc inside' }}>
            {(recipe.ingredients || []).map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
          <button
            style={{ marginTop: 8, padding: '6px 16px', borderRadius: 4, background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}
            onClick={() => {
              const text = (recipe.ingredients || []).join('\n')
              navigator.clipboard.writeText(text)
                .then(() => toast.success('Shopping list copied!'))
                .catch(() => toast.error('Failed to copy shopping list'))
            }}
          >
            Copy Shopping List
          </button>
        </div>
      </div>

      {/* Nutritional Information */}
      <div>
        <h3>Nutritional Information</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 400 }}>
          <tbody>
            <tr><td>Calories</td><td>{recipe.nutrition?.calories ?? 0} kcal</td></tr>
            <tr><td>Protein</td><td>{recipe.nutrition?.protein ?? 0} g</td></tr>
            <tr><td>Fat</td><td>{recipe.nutrition?.fat ?? 0} g</td></tr>
            <tr><td>Carbs</td><td>{recipe.nutrition?.carbs ?? 0} g</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>Instructions</h3>
        <ol>{(recipe.instructions || []).map((step, i) => <li key={i}>{step}</li>)}</ol>
      </div>
      <div>
        <h3>Your Rating</h3>
        <Rating value={recipe.userRating || 0} onChange={onRate} />
      </div>

      {/* Comments Section */}
      <div>
        <h3>Comments</h3>
        {commentsLoading ? <Loader text="Loading comments..." /> : null}
        {!commentsLoading && comments.length === 0 && <div>No comments yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {comments.map((comment) => (
            <div key={comment._id} style={{ border: '1px solid #eee', borderRadius: 6, padding: 8, background: '#fafafa', position: 'relative' }}>
              <div style={{ fontWeight: 'bold' }}>{comment.user?.name || comment.user?.email || 'User'}</div>
              <div style={{ margin: '4px 0' }}>{comment.text}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{new Date(comment.createdAt).toLocaleString()}</div>
              {isAuthenticated && user && String(user._id || user.id) === String(comment.user?._id || comment.user?.id) && (
                <button
                  style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#d00', cursor: 'pointer' }}
                  onClick={async () => {
                    if (!window.confirm('Delete this comment?')) return
                    try {
                      await api.delete(`/comments/${comment._id}`)
                      toast.success('Comment deleted')
                      fetchComments()
                    } catch {
                      toast.error('Failed to delete comment')
                    }
                  }}
                  title="Delete comment"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Comment Form */}
        {isAuthenticated ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setCommentError('')
              if (!commentText.trim()) {
                setCommentError('Comment cannot be empty')
                return
              }
              setCommentSubmitting(true)
              try {
                await api.post(`/comments/recipe/${id}`, { text: commentText })
                setCommentText('')
                toast.success('Comment added')
                fetchComments()
              } catch (err) {
                setCommentError(err?.response?.data?.message || 'Failed to add comment')
              } finally {
                setCommentSubmitting(false)
              }
            }}
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={3}
              placeholder="Add a comment..."
              style={{ resize: 'vertical', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              disabled={commentSubmitting}
            />
            <ErrorMessage message={commentError} />
            <button type="submit" disabled={commentSubmitting} style={{ alignSelf: 'flex-end', padding: '6px 16px', borderRadius: 4, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {commentSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <div style={{ marginTop: 8 }}>
            <Link to="/login">Log in</Link> to add a comment.
          </div>
        )}
      </div>
    </div>
  )
}
