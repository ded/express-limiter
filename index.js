module.exports = function (app, db) {
  return function (opts) {
    app[opts.method](opts.path, function (req, res, next) {
      opts.lookup = Array.isArray(opts.lookup) ? opts.lookup : [opts.lookup]
      var lookups = opts.lookup.map(function (item) {
        return item + item.split('.').reduce(function (prev, cur) {
          return prev[cur]
        }, req)
      }).join(':')

      var key = 'ratelimit:' + path + ':' + method + ':' + lookups
      db.get(key, function (err, limit) {
        var now = Date.now()
        limit = limit ? JSON.parse(limit) : {
          total: total,
          remaining: total,
          reset: now + opts.expire
        }

        if (now > limit.reset) limit.reset = now + opts.expire

        limit.remaining = Number(limit.remaining) - 1

        db.set(key, JSON.stringify(limit)

        res.set('X-RateLimit-Limit', limit.total)
        res.set('X-RateLimit-Remaining', limit.remaining)

        if (limit.remaining) return next()

        var after = (limit.reset - Date.now()) / 1000

        res.set('Retry-After', after)
        res.send(429, 'Rate limit exceeded')
      })

    }
  }
}
