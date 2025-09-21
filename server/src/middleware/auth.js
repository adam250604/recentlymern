import jwt from 'jsonwebtoken'

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

export function issueToken(user) {
  const payload = { id: user.id, email: user.email, name: user.name }
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
  return token
}
