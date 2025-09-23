# MERN Recipe Sharing Platform

This is a full-stack MERN (MongoDB, Express, React, Node.js) recipe sharing platform. It supports authentication, recipe management, social features, recommendations, comments, nutritional info, shopping list, and more.

## Features

- User authentication (JWT)
- Recipe CRUD (create, edit, delete, image upload)
- Recipe browsing, search, and filter
- Favorites and rating system
- Dashboard with own recipes, favorites, recommendations
- User profile with follow/unfollow
- Social features: follow/unfollow users
- Recipe comments and reviews
- Recipe sharing (Facebook, Twitter, WhatsApp, Web Share API)
- Recipe recommendations (top-rated, personalized)
- Nutritional information (calories, protein, fat, carbs)
- Shopping list generator (copy ingredients)
- Account deletion functionality
- Responsive/mobile-first design
- API documentation and code comments

## Setup

### Requirements
- Node.js 18+
- MongoDB (for production)

### Installation
1. Install dependencies:
   ```sh
   npm install
   ```
2. Configure backend API URL:
   - Edit `.env.local` and set `VITE_API_BASE_URL` to your backend
3. Run dev server:
   ```sh
   npm run dev
   ```
4. For backend, see `server/README.md` and run:
   ```sh
   cd server
   npm install
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /auth/login` — Login
- `POST /auth/register` — Register

### Recipes
- `GET /recipes` — List/search recipes
- `GET /recipes/:id` — Recipe detail
- `POST /recipes` — Create recipe
- `PUT /recipes/:id` — Edit recipe
- `POST /recipes/:id/favorite` — Add to favorites
- `DELETE /recipes/:id/favorite` — Remove from favorites
- `POST /recipes/:id/rating` — Rate recipe
- `GET /recipes/recommendations` — Get recommended recipes

### Users
- `GET /users/me` — Get current user
- `PUT /users/me` — Update profile
- `DELETE /users/me` — Delete account
- `GET /users/me/recipes` — User's recipes
- `GET /users/me/favorites` — User's favorites
- `POST /users/:id/follow` — Follow user
- `POST /users/:id/unfollow` — Unfollow user
- `GET /users/:id` — Get user profile

### Comments
- `GET /comments/recipe/:recipeId` — List comments for recipe
- `POST /comments/recipe/:recipeId` — Add comment
- `DELETE /comments/:id` — Delete comment

## Usage

- Register and login to access all features
- Create, edit, and delete recipes
- Search and filter recipes
- Favorite and rate recipes
- Follow/unfollow other users
- Add and delete comments on recipes
- Share recipes on social media
- View nutritional info and generate shopping lists
- Delete your account if needed
- Enjoy a responsive experience on all devices

## Testing Flows

- Login/Register
- CRUD recipes (create, edit, delete)
- Search/filter recipes
- Favorite toggle on cards/detail
- Rate a recipe on detail
- Dashboard and profile updates
- Add/delete comments
- Share recipes
- Account deletion
- Shopping list copy

## Code Documentation

- Key files include JSDoc/code comments for models, routes, and components
- See `server/src/models/`, `server/src/routes/`, and `src/components/` for inline documentation

## License

MIT
