## Express rate-limitter
Rate limiting middleware for Express applications built on redis

``` js
var express = require('express')
var app = express()
var client = require('redis').createClient()

var limitter = require('rate-limitter')(app, client)

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

 - `path`: route path to the request
 - `method`: http method. accepts `get`, `post`, `put`, `delete`, and of course Express' `all`
 - `lookup`: value lookup on the request object. Can be a single value or array. See [examples](#examples) for common usages
 - `total`: allowed number of requests before getting rate limited
 - `expire`: amount of time in `ms` before the rate-limited is reset

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
```

## License MIT

Happy Rate Limitting!
