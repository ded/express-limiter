## Express rate-limitter
Rate limiting middleware for Express applications.


``` js
var limitter = require('expa').limitter(app, client)

limitter({
  path: '/like',
  method: 'get',
  lookup: ['req.user.id', 'req.connection.remoteAddress'],
  total: 100,
  expire: 1000 * 60 * 60
})

```
