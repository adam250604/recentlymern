import 'dotenv/config'
import mongoose from 'mongoose'
import Recipe from '../src/models/Recipe.js'

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) { return arr.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]) }

const adjectives = ['Spicy','Creamy','Zesty','Savory','Crispy','Smoky','Tangy','Sweet','Hearty','Fresh']
const cuisines = ['Italian','Mexican','Thai','Indian','French','American','Japanese','Greek','Spanish','Korean']
const dishes = ['Pasta','Salad','Soup','Curry','Stir Fry','Tacos','Sandwich','Stew','Noodles','Rice Bowl']
const ingredientsPool = ['Chicken','Beef','Pork','Tofu','Mushrooms','Onion','Garlic','Tomato','Bell Pepper','Carrot','Zucchini','Spinach','Basil','Cheese','Eggs','Milk','Cream','Butter','Olive Oil','Rice','Pasta','Noodles','Beans','Lentils','Chili']
const stepsPool = ['Prep ingredients','Heat pan','Add oil','Sauté aromatics','Add protein','Stir in veggies','Season generously','Simmer until tender','Adjust seasoning','Plate and garnish']
const categories = ['breakfast','lunch','dinner']
const difficulties = ['easy','medium','hard']

const N = parseInt(process.argv[2] || '200', 10)

async function main() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI not set in server/.env')
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  const docs = []
  for (let i = 0; i < N; i++) {
    const title = `${pick(adjectives)} ${pick(cuisines)} ${pick(dishes)}`
    const countIng = randInt(5, 9)
    const ings = shuffle(ingredientsPool).slice(0, countIng)
    const countSteps = randInt(4, 7)
    const steps = (new Array(countSteps)).fill(null).map((_, idx) => `${idx+1}. ${pick(stepsPool)}`)
    const category = pick(categories)
    const cookingTime = randInt(5, 120)
    const difficulty = pick(difficulties)
    const seed = `${title.replace(/\s+/g,'-').toLowerCase()}-${i}-${Date.now()}`
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`
    const thumbUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/480/360`
    const createdAt = new Date(Date.now() - randInt(0, 60*24*60*60*1000)) // last 60 days
    const avgRating = Math.round((Math.random()*5)*10)/10

    docs.push({
      title,
      imageUrl,
      thumbUrl,
      ingredients: ings,
      instructions: steps,
      category,
      cookingTime,
      difficulty,
      avgRating,
      ratings: {},
      favorites: [],
      ownerId: null,
      createdAt,
    })
  }

  const res = await Recipe.insertMany(docs, { ordered: false })
  console.log(`Inserted ${res.length} recipes`)
  await mongoose.disconnect()
  console.log('Done')
}

main().catch(async (e) => {
  console.error('Seed error:', e.message)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
