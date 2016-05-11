'use strict'

const test = require('tape')
const _ = require('underscore')
require('json5/lib/require')

const webhookTransmogrifier = require('../webhook-transmogrifier.js')
const webhookConfig = require('../webhook-config.js')

const input = {
  "locations": [
    {"name": "Seattle", "state": "WA"},
    {"name": "New York", "state": "NY"},
    {"name": "Bellevue", "state": "WA"},
    {"name": "Olympia", "state": "WA"},
  ]
}
const configs = require('./test-configs.json5')

test('manditory properties', function (t) {
  t.plan(2)
  const configs = { empty: {} }

  const config = webhookConfig.configFor('empty', configs)
  const errs = webhookConfig.validateConfig(config)
  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/destination/), 'should be missing required options')
})

test('extra / invalid config keys', function (t) {
  t.plan(2)

  const configs = { extraKeys: { destinations: [{ foo: "bar", url: "http://url.com" }], whomp: "whomp" } }

  const config = webhookConfig.configFor('extraKeys', configs)
  const errs = webhookConfig.validateConfig(config)
  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/whomp/) && errs[0].match(/foo/), 'should be invalid option')
})

test('operations are wrong types', function (t) {
  t.plan(3)

  const configs = { operationsWrongTypes: { destinations: [{ url: "http://url.com", extractions: "" }], filters: 1 }}

  const config = webhookConfig.configFor('operationsWrongTypes', configs)
  const errs = webhookConfig.validateConfig(config)

  t.equal(errs.length, 2, 'should have error')
  t.ok(errs[0].match(/array/), 'should have type error')
  t.ok(errs[1].match(/array/), 'should have type error')
})

test('invalid options', function (t) {
  t.plan(2)

  const configs = { operationsWrongOptions: { destinations: [{ url: "http://url.com" }], extracion: {}, fillers: [] }}

  const config = webhookConfig.configFor('operationsWrongOptions', configs)
  const errs = webhookConfig.validateConfig(config)

  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/invalid config/), 'should have invalid option error')
})

test('invalid urls', function (t) {
  t.plan(2)

  const configs = { invalidUrls: { destinations: [{ url: "ht" }, { url: "www.wrong.com"}] }}

  const config = webhookConfig.configFor('invalidUrls', configs)
  const errs = webhookConfig.validateConfig(config)

  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/wrong/), 'should have url error')
})

test('config defaults', function (t) {
  t.plan(3)

  const config = webhookConfig.configFor('defaults', configs)

  t.ok(_.isArray(config.filters), 'filters default should be used')
  t.ok(_.isArray(config.transformations), 'transformations default should be used')
  t.ok(_.isArray(config.extractions), 'extractions default should be used')
})


test('missing config', function (t) {
  t.plan(3)

  const jsonEvent = {
    configName: 'missingConfig',
    method: "Post",
    json: input,
  }
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.equal(results.sent.length, 0, 'should not be sent')
    t.equal(results.errors.length, 1, 'should have errors')
    t.ok(results.log().match(/missing/), 'should have missing config log msg')
  }, configs)
})

test('multi destination transmogrify webhook', function (t) {
  t.plan(4)

  const jsonEvent = {
    configName: 'multiDestinations',
    method: "Post",
    json: input,
  }
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.equal(results.sent.length, 2, 'should be sent')
    t.equal(results.deliveryErrors.length, 0, 'should not have errors')
    t.same(results.sent[0].json, { city: 'Seattle', message: 'you live in Seattle' }, 'should be location')
    t.same(results.sent[1].json, { city: 'Seattle', message: 'you live in Seattle' }, 'should be location')
  }, configs)
})

test('transmogrify webhook with single filter', function (t) {
  t.plan(2)

  const jsonEvent = {
    configName: 'singleFilter',
    method: "Post",
    json: input,
  }
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.equal(results.filtered.length, 1, 'should be filtered')
    t.equal(results.sent.length, 0, 'should not be sent')
  }, configs)
})

test('transmogrify webhook with multi destinations and transformations', function (t) {
  t.plan(4)

  const jsonEvent = {
    configName: 'multiDestinationTransformations',
    method: "Post",
    json: input,
  }
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.equal(results.filtered.length, 1, 'should be filtered')
    t.equal(results.sent.length, 2, 'should be sent')
    results.sent.sort((a, b) => { return a.json.index >= b.json.index })
    t.same(results.sent[0].json, { index: 1, emailTo: 'david@seattle.com', k: [ 'locations' ], message: 'you live in Seattle', someStates: [ 'NY', 'WA' ] }, 'should have json')
    t.same(results.sent[1].json, { index: 2, emailAddress: 'not-david@seattle.com', importantState: 'NY' }, 'should have json')
  }, configs)
})


test('destination with bad host', function (t) {
  t.plan(1)

  const jsonEvent = {
    configName: 'badHost',
    method: "Post",
    json: input,
  }
  const configs = { badHost: { destinations: [ { url: "http://asdlfwpierasdflja.com" } ] }}
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.ok(results.deliveryErrors[0].response.match(/NOTFOUND/), 'should have not found error')
  }, configs)
})

test('404 error', function (t) {
  t.plan(1)

  const jsonEvent = {
    configName: 'badHost',
    method: "Post",
    json: input,
  }
  const configs = { badHost: { destinations: [ { url: "http://www.google.com/asdflaskdfja" } ] }}
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.equals(results.deliveryErrors[0].statusCode, 404, 'should have 404')
  }, configs)
})

test('configed auth becomes request options', function (t) {
  t.plan(1)

  const jsonEvent = {
    configName: 'withAuth',
    method: "Post",
    json: input,
  }
  const configs = {
    withAuth: {
      destinations: [{
        url: "http://jsonplaceholder.typicode.com/posts" ,
        auth: { user: "test", password: "password", },
        method: "Post",
      }]
    }
  }
  webhookTransmogrifier.process(jsonEvent, (results) => {
    debugger
    t.ok(_.has(results.sent[0].requestOptions, 'auth'), 'has auth option')
  }, configs)
})

test('json flattened for get request', function (t) {
  t.plan(2)

  const jsonEvent = {
    configName: 'getRequest',
    method: "POST",
    json: input,
  }

  const configs = {
    getRequest: {
      destinations: [ { url: "http://jsonplaceholder.typicode.com/posts/1", method: 'GET' } ]
    }
  }

  webhookTransmogrifier.process(jsonEvent, (results) => {
    const requestOptions = results.sent[0].requestOptions
    t.ok(_.has(requestOptions, 'qs'), 'has query string parameters')
    t.ok(_.has(requestOptions.qs, 'locations'), 'has query string location parameter')
  }, configs)
})
