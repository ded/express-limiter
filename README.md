## Express rate-limitter
Rate limiting middleware for Express applications built on redis

``` js
var express = require('express')
var app = express()
var client = require('redis').createClient()

var limitter = require('express-limiter')(app, client)

limitter({
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

 - `path`: `String` route path to the request
 - `method`: `String` http method. accepts `get`, `post`, `put`, `delete`, and of course Express' `all`
 - `lookup`: `String|Array.<String>` value lookup on the request object. Can be a single value or array. See [examples](#examples) for common usages
 - `total`: `Number` allowed number of requests before getting rate limited
 - `expire`: `Number` amount of time in `ms` before the rate-limited is reset
 - `whitelist`: `function(req)` optional param allowing the ability to whitelist. return `boolean`, `true` to whitelist, `false` to passthru to limitter.

### Examples

``` js
// limit by IP address
limitter({
  lookup: 'connection.remoteAddress'
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

```

## License MIT

Happy Rate Limitting!
