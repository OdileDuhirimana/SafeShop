import ActivityLog from '../models/ActivityLog.js'

export function activityLogger(action){
  return async (req, res, next) => {
    res.on('finish', async () => {
      try {
        await ActivityLog.create({
          userId: req.user?.id || null,
          action: `${action}:${req.method} ${req.originalUrl}`,
          ip: req.ip,
          meta: { status: res.statusCode }
        })
      } catch {}
    })
    next()
  }
}
