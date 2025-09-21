import mongoose from 'mongoose'

export async function connectIfConfigured() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.log('MONGO_URI not set - using in-memory store')
    return
  }
  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (e) {
    console.error('MongoDB connect error:', e.message)
  }
}
