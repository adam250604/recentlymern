// Lightweight mock API for development without a backend
// Enable with VITE_USE_MOCKS=true

function delay(ms) { return new Promise((res) => setTimeout(res, ms)) }
function ok(config, data, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
    request: {}
  }
}
function parseFormData(body) {
  if (!body) return {}
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return {} }
  }
  if (body instanceof FormData) {
    const result = {}
    for (const [k, v] of body.entries()) {
      if (k.startsWith('ingredients[')) {
        const idx = Number(k.match(/ingredients\[(\d+)\]/)?.[1] || 0)
        result.ingredients = result.ingredients || []
        result.ingredients[idx] = v
      } else if (k.startsWith('instructions[')) {
        const idx = Number(k.match(/instructions\[(\d+)\]/)?.[1] || 0)
        result.instructions = result.instructions || []
        result.instructions[idx] = v
      } else if (k === 'image') {
        result.image = v
      } else {
        result[k] = v
      }
    }
    return result
  }
  return body
}

export function attachMocks(api) {
  if (attachMocks._installed) return
  attachMocks._installed = true

  const db = {
    user: { id: '1', name: 'Demo User', email: 'demo@example.com' },
    recipes: [
      {
        id: '1',
        title: 'Spaghetti Bolognese',
        imageUrl: 'https://images.unsplash.com/photo-1604908177073-7148a0a5333b?q=80&w=1200&auto=format&fit=crop',
        ingredients: ['Spaghetti', 'Minced beef', 'Tomato sauce', 'Onion', 'Garlic'],
        instructions: ['Boil pasta', 'Cook beef with onion/garlic', 'Add sauce', 'Combine'],
        category: 'dinner',
        avgRating: 4.2,
        ratings: { '1': 4 },
        favorites: new Set(['1']),
        ownerId: '1',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
      },
      {
        id: '2',
        title: 'Avocado Toast',
        imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1200&auto=format&fit=crop',
        ingredients: ['Bread', 'Avocado', 'Salt', 'Pepper', 'Lemon'],
        instructions: ['Toast bread', 'Mash avocado', 'Season and spread'],
        category: 'breakfast',
        avgRating: 4.6,
        ratings: {},
        favorites: new Set(),
        ownerId: '1',
        createdAt: Date.now() - 1000 * 60 * 60 * 8
      }
    ],
    nextId: 3
  }

  function currentUser(config) {
    const token = (config.headers?.Authorization || '').replace('Bearer ', '')
    return token ? db.user : null
  }

  function toClientRecipe(r, user) {
    return {
      id: r.id,
      title: r.title,
      imageUrl: r.imageUrl,
      ingredients: r.ingredients,
      instructions: r.instructions,
      category: r.category,
      avgRating: r.avgRating,
      isFavorite: user ? r.favorites.has(user.id) : false,
      userRating: user ? r.ratings[user.id] || 0 : 0
    }
  }

  api.interceptors.request.use(async (config) => {
    const url = config.url || ''
    const method = (config.method || 'get').toLowerCase()

    if (!url?.startsWith('/auth') && !url?.startsWith('/recipes') && !url?.startsWith('/users')) {
      return config
    }

    // install custom adapter for this request only
    config.adapter = async () => {
      await delay(150)
      const user = currentUser(config)
      const params = config.params || {}
      const body = parseFormData(config.data)

      // AUTH
      if (url === '/auth/login' && method === 'post') {
        return ok(config, { token: 'mock-token', user: db.user })
      }
      if (url === '/auth/register' && method === 'post') {
        const { name, email } = body
        if (name) db.user.name = name
        if (email) db.user.email = email
        return ok(config, { token: 'mock-token', user: db.user })
      }
      if (url === '/auth/reset-password' && method === 'post') {
        return ok(config, { ok: true })
      }

      // USERS
      if (url === '/users/me' && method === 'get') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        return ok(config, { id: db.user.id, name: db.user.name, email: db.user.email })
      }
      if (url === '/users/me' && method === 'put') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        db.user.name = body.name ?? db.user.name
        db.user.email = body.email ?? db.user.email
        return ok(config, { id: db.user.id, name: db.user.name, email: db.user.email })
      }
      if (url === '/users/me/recipes' && method === 'get') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const items = db.recipes.filter((r) => r.ownerId === user.id).map((r) => toClientRecipe(r, user))
        return ok(config, { items })
      }
      if (url === '/users/me/favorites' && method === 'get') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const items = db.recipes.filter((r) => r.favorites.has(user.id)).map((r) => toClientRecipe(r, user))
        return ok(config, { items })
      }

      // RECIPES LIST
      if (url === '/recipes' && method === 'get') {
        let list = [...db.recipes]
        if (params.q) {
          const q = String(params.q).toLowerCase()
          list = list.filter((r) => r.title.toLowerCase().includes(q))
        }
        if (params.category) {
          list = list.filter((r) => r.category === params.category)
        }
        if (params.sort === 'rating') list.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
        else if (params.sort === 'popular') list.sort((a, b) => (b.favorites.size) - (a.favorites.size))
        else list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        return ok(config, { items: list.map((r) => toClientRecipe(r, user)) })
      }

      // RECIPES DETAIL
      const detailMatch = url.match(/^\/recipes\/(\w+)/)
      if (detailMatch && method === 'get' && url === `/recipes/${detailMatch[1]}`) {
        const r = db.recipes.find((x) => x.id === detailMatch[1])
        if (!r) return ok(config, { message: 'Not found' }, 404)
        return ok(config, toClientRecipe(r, user))
      }

      // CREATE
      if (url === '/recipes' && method === 'post') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const id = String(db.nextId++)
        const r = {
          id,
          title: body.title || 'Untitled',
          imageUrl: body.image ? URL.createObjectURL(body.image) : 'https://images.unsplash.com/photo-1604908177073-7148a0a5333b?q=80&w=1200&auto=format&fit=crop',
          ingredients: body.ingredients?.filter(Boolean) || [],
          instructions: body.instructions?.filter(Boolean) || [],
          category: body.category || '',
          avgRating: 0,
          ratings: {},
          favorites: new Set(),
          ownerId: user.id,
          createdAt: Date.now()
        }
        db.recipes.push(r)
        return ok(config, { id })
      }

      // UPDATE
      const editMatch = url.match(/^\/recipes\/(\w+)$/)
      if (editMatch && method === 'put') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const r = db.recipes.find((x) => x.id === editMatch[1])
        if (!r) return ok(config, { message: 'Not found' }, 404)
        if (r.ownerId !== user.id) return ok(config, { message: 'Forbidden' }, 403)
        r.title = body.title ?? r.title
        r.category = body.category ?? r.category
        r.ingredients = body.ingredients?.filter(Boolean) ?? r.ingredients
        r.instructions = body.instructions?.filter(Boolean) ?? r.instructions
        if (body.image) r.imageUrl = URL.createObjectURL(body.image)
        return ok(config, toClientRecipe(r, user))
      }

      // FAVORITE
      const favMatch = url.match(/^\/recipes\/(\w+)\/favorite$/)
      if (favMatch && method === 'post') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const r = db.recipes.find((x) => x.id === favMatch[1])
        if (!r) return ok(config, { message: 'Not found' }, 404)
        r.favorites.add(user.id)
        return ok(config, { ok: true })
      }
      if (favMatch && method === 'delete') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const r = db.recipes.find((x) => x.id === favMatch[1])
        if (!r) return ok(config, { message: 'Not found' }, 404)
        r.favorites.delete(user.id)
        return ok(config, { ok: true })
      }

      // RATING
      const rateMatch = url.match(/^\/recipes\/(\w+)\/rating$/)
      if (rateMatch && method === 'post') {
        if (!user) return ok(config, { message: 'Unauthorized' }, 401)
        const r = db.recipes.find((x) => x.id === rateMatch[1])
        if (!r) return ok(config, { message: 'Not found' }, 404)
        const value = Number(body.value || 0)
        r.ratings[user.id] = value
        const values = Object.values(r.ratings)
        r.avgRating = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
        return ok(config, { ok: true })
      }

      return ok(config, { message: 'Not implemented', url, method }, 404)
    }

    return config
  })
}
