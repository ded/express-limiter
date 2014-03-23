var chai = require('chai')
  , expect = chai.expect
  , request = require('supertest')
  , sinon = require('sinon')
  , redis = require('redis').createClient()
  , v = require('valentine')
  , subject = require('../')

chai.use(require('sinon-chai'))

describe('rate-limitter', function () {
  var express, app

  beforeEach(function () {
    express = require('express')
    app = express()
    limitter = subject(app, redis)
  })

  afterEach(function (done) {
    redis.flushdb(done)
  })

  it('should work', function (done) {
    var map = [10, 9, 8, 7, 6, 5, 4, 3, 2]
    var clock = sinon.useFakeTimers()
    limitter({
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
})
