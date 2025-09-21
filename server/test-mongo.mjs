import 'dotenv/config'
import mongoose from 'mongoose'

const uri = process.env.MONGO_URI
if (!uri) {
  console.error('MONGO_URI not set')
  process.exit(1)
}
try {
  await mongoose.connect(uri)
  console.log('Mongo OK')
  await mongoose.disconnect()
  process.exit(0)
} catch (e) {
  console.error('Mongo ERR:', e.message)
  process.exit(2)
}
