import mongoose from 'mongoose'

export async function connectIfConfigured() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.log('MONGODB_URI not set - using in-memory store')
    return
  }
  
  // Set connection options to handle timeouts and buffering
  const options = {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  }
  
  try {
    // Disable mongoose buffering to prevent timeout errors
    mongoose.set('bufferCommands', false)
    
    await mongoose.connect(uri, options)
    console.log('MongoDB connected successfully')
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected')
    })
    
  } catch (e) {
    console.error('MongoDB connect error:', e.message)
    throw e
  }
}
