## Express rate-limiter
Rate limiting middleware for Express applications built on redis

``` sh
npm install express-limiter --save
```

``` js
var express = require('express')
var app = express()
var client = require('redis').createClient()

var limiter = require('express-limiter')(app, client)

/**
 * you may also pass it an Express 4.0 `Router`
 *
 * router = express.Router()
 * limiter = require('express-limiter')(router, client)
 */

limiter({
  path: '/api/action',
  method: 'get',
  lookup: ['connection.remoteAddress'],
  // 150 requests per hour
  total: 150,
  expire: 1000 * 60 * 60
})

app.get('/api/action', function (req, res) {
  res.send(200, 'ok')
})
```

### API options

``` js
limiter(options)
```

 - `path`: `String` *optional* route path to the request
 - `method`: `String` *optional* http method. accepts `get`, `post`, `put`, `delete`, and of course Express' `all`
 - `lookup`: `String|Array.<String>` value lookup on the request object. Can be a single value or array. See [examples](#examples) for common usages
 - `total`: `Number` allowed number of requests before getting rate limited
 - `expire`: `Number` amount of time in `ms` before the rate-limited is reset
 - `whitelist`: `function(req)` optional param allowing the ability to whitelist. return `boolean`, `true` to whitelist, `false` to passthru to limiter.
 - `skipHeaders`: `Boolean` whether to skip sending HTTP headers for rate limits ()
 - `ignoreErrors`: `Boolean` whether errors generated from redis should allow the middleware to call next().  Defaults to false.

### Examples

``` js
// limit by IP address
limiter({
  ...
  lookup: 'connection.remoteAddress'
  ...
})

// or if you are behind a trusted proxy (like nginx)
limiter({
  lookup: 'headers.x-forwarded-for'
})

// by user (assuming a user is logged in with a valid id)
limiter({
  lookup: 'user.id'
})

// limit your entire app
limiter({
  path: '*',
  method: 'all',
  lookup: 'connection.remoteAddress'
})

// limit users on same IP
limiter({
  path: '*',
  method: 'all',
  lookup: ['user.id', 'connection.remoteAddress']
})

// whitelist user admins
limiter({
  path: '/delete/thing',
  method: 'post',
  lookup: 'user.id',
  whitelist: function (req) {
    return !!req.user.is_admin
  }
})

// skip sending HTTP limit headers
limiter({
  path: '/delete/thing',
  method: 'post',
  lookup: 'user.id',
  whitelist: function (req) {
    return !!req.user.is_admin
  },
  skipHeaders: true
})

```

### as direct middleware

``` js
app.post('/user/update', limiter({ lookup: 'user.id' }), function (req, res) {
  User.find(req.user.id).update(function (err) {
    if (err) next(err)
    else res.send('ok')
  })
})
```

## License MIT

Happy Rate Limiting!
