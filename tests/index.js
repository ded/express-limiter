var chai = require('chai')
  , expect = chai.expect
  , request = require('supertest')
  , sinon = require('sinon')
  , redis = require('redis').createClient()
  , v = require('valentine')
  , subject = require('../')

chai.use(require('sinon-chai'))

describe('rate-limiter', function () {
  var express, app

  beforeEach(function () {
    express = require('express')
    app = express()
    limiter = subject(app, redis)
  })

  afterEach(function (done) {
    redis.flushdb(done)
  })

  it('should work', function (done) {
    var map = [10, 9, 8, 7, 6, 5, 4, 3, 2]
    var clock = sinon.useFakeTimers()

    limiter({
      path: '/route',
      method: 'get',
      lookup: ['connection.remoteAddress'],
      total: 10,
      expire: 1000 * 60 * 60
    })

    app.get('/route', function (req, res) {
      res.send(200, 'hello')
    })

    var out = (map).map(function (item) {
      return function (f) {
        process.nextTick(function () {
          request(app)
          .get('/route')
          .expect('X-RateLimit-Limit', 10)
          .expect('X-RateLimit-Remaining', item - 1)
          .expect(200, function (e) {f(e)})
        })
      }
    })
    out.push(function (f) {
      request(app)
      .get('/route')
      .expect('X-RateLimit-Limit', 10)
      .expect('X-RateLimit-Remaining', 0)
      .expect('Retry-After', /\d+/)
      .expect(429, function (e) {f(e)})
    })
    out.push(function (f) {
      // expire the time
      clock.tick(1000 * 60 * 60 + 1)
      request(app)
      .get('/route')
      .expect('X-RateLimit-Limit', 10)
      .expect('X-RateLimit-Remaining', 9)
      .expect(200, function (e) {
        clock.restore()
        f(e)
      })
    })
    v.waterfall(out, done)
  })

  describe('options', function() {
    it('should process skipHeaders', function (done) {
      limiter({
        path: '/route',
        method: 'get',
        lookup: ['connection.remoteAddress'],
        total: 0,
        expire: 1000 * 60 * 60,
        skipHeaders: true
      })

      app.get('/route', function (req, res) {
        res.send(200, 'hello')
      })

      request(app)
        .get('/route')
          .expect(function(res) { if ('X-RateLimit-Limit' in res.headers) return 'X-RateLimit-Limit Header not to be set' })
          .expect(function(res) { if ('X-RateLimit-Remaining' in res.headers) return 'X-RateLimit-Remaining Header not to be set' })
          .expect(function(res) { if ('Retry-After' in res.headers) return 'Retry-After not to be set' })
          .expect(429, done)
    })
  })
})
