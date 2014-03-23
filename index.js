module.exports = function (app, db) {
  return function (opts) {
    app[opts.method](opts.path, function (req, res, next) {
      if (opts.whitelist && opts.whitelist(req)) return next()
      opts.lookup = Array.isArray(opts.lookup) ? opts.lookup : [opts.lookup]

      var lookups = opts.lookup.map(function (item) {
        return item + ':' + item.split('.').reduce(function (prev, cur) {
          return prev[cur]
        }, req)
      }).join(':')

      var key = 'ratelimit:' + opts.path + ':' + opts.method + ':' + lookups
      db.get(key, function (err, limit) {
        var now = Date.now()
        limit = limit ? JSON.parse(limit) : {
          total: opts.total,
          remaining: opts.total,
          reset: now + opts.expire
        }

        if (now > limit.reset) {
          limit.reset = now + opts.expire
          limit.remaining = opts.total
        }

        // do not allow negative remaining
        limit.remaining = Math.max(Number(limit.remaining) - 1, 0)

        db.set(key, JSON.stringify(limit), function () {
          res.set('X-RateLimit-Limit', limit.total)
          res.set('X-RateLimit-Remaining', limit.remaining)

          if (limit.remaining) return next()

          var after = (limit.reset - Date.now()) / 1000

          res.set('Retry-After', after)
          res.send(429, 'Rate limit exceeded')
        })

      })

    })
  }
}
