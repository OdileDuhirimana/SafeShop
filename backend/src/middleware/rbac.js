export function requireRole(...roles){
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

export function isSelfOrRole(getResourceUserIdFn, ...roles){
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (roles.includes(req.user.role)) return next()
    try {
      const resourceUserId = await getResourceUserIdFn(req)
      if (String(resourceUserId) === String(req.user.id)) return next()
      return res.status(403).json({ error: 'Forbidden' })
    } catch {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }
}
