
'use strict'

const test = require('tape')
const _ = require('underscore')

const Request = require('../webhook-request.js')
require('json5/lib/require')
const configs = require('./test-configs.json5')

test('request data becomes json', function (t) {
  t.plan(1)

  const jsonEvent = {
    configName: 'data-not-json',
    method: "Post",
    json: 1,
  }

  const config = {}
  const fn = () => new Request(jsonEvent, config)
  t.throws(fn, /JSON/, 'expect exception re: data is not json')
})

test('form request with embeded uri encoded json becomes json', function (t) {
  t.plan(1)

  const jsonEvent = {
    configName: 'embeded-json-data',
    method: "Post",
    contentType: 'application/x-www-form-urlencoded',
    body: 'test=%7B%22asdf%22%3A%22asdffdsa%22%7D',
  }

  const config = { jsonEmbededFormParameter: 'test' }
  const r = new Request(jsonEvent, config)
  t.ok(_.isObject(r.json), 'expect json')
})

test('form request without embeded uri encoded json fails', function (t) {
  t.plan(1)

  const jsonEvent = {
    configName: 'bad-embeded-data',
    method: "Post",
    contentType: 'application/x-www-form-urlencoded',
    body: 'test=%asdf',
  }

  const config = { jsonEmbededFormParameter: 'test' }

  const fn = () => new Request(jsonEvent, config)
  t.throws(fn, /malformed/, 'expect exception re: embeded data can not be parsed')
})
