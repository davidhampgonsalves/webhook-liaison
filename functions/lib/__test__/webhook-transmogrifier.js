'use strict'

var test = require('tape')
var _ = require('underscore')
require('json5/lib/require')

var webhookTransmogrifier = require('../webhook-transmogrifier.js')

//TODO: add tests for
//  auth
//  verify no config errors on valid cases
//  action is array but inside is number or array
//  failed delivery b/c:
//    non 200
//    timeout
var input = {
  "locations": [
    {"name": "Seattle", "state": "WA"},
    {"name": "New York", "state": "NY"},
    {"name": "Bellevue", "state": "WA"},
    {"name": "Olympia", "state": "WA"},
  ]
}
var configs = require('./test-configs.json5')

test('manditory properties', function (t) {
  t.plan(2)
  var configs = { empty: {} }

  var config = webhookTransmogrifier.configFor('empty', configs)
  var errs = webhookTransmogrifier.validateConfig(config)
  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/destination/), 'should be missing required options')
})

test('extra / invalid config keys', function (t) {
  t.plan(2)

  var configs = { extraKeys: { destinations: [{ foo: "bar", url: "http://url.com" }], whomp: "whomp" } }

  var config = webhookTransmogrifier.configFor('extraKeys', configs)
  var errs = webhookTransmogrifier.validateConfig(config)
  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/whomp/) && errs[0].match(/foo/), 'should be invalid option')
})

test('operations are wrong types', function (t) {
  t.plan(3)

  var configs = { operationsWrongTypes: { destinations: [{ url: "http://url.com", extractions: "" }], filters: 1 }}

  var config = webhookTransmogrifier.configFor('operationsWrongTypes', configs)
  var errs = webhookTransmogrifier.validateConfig(config)

  t.equal(errs.length, 2, 'should have error')
  t.ok(errs[0].match(/array/), 'should have type error')
  t.ok(errs[1].match(/array/), 'should have type error')
})

test('invalid urls', function (t) {
  t.plan(2)

  var configs = { invalidUrls: { destinations: [{ url: "ht" }, { url: "www.wrong.com"}] }}

  var config = webhookTransmogrifier.configFor('invalidUrls', configs)
  var errs = webhookTransmogrifier.validateConfig(config)

  t.equal(errs.length, 1, 'should have error')
  t.ok(errs[0].match(/wrong/), 'should have url error')
})

test('config defaults', function (t) {
  t.plan(3)

  var config = webhookTransmogrifier.configFor('defaults', configs)

  t.ok(_.isArray(config.filters), 'filters default should be used')
  t.ok(_.isArray(config.transformations), 'transformations default should be used')
  t.ok(_.isArray(config.extractions), 'extractions default should be used')
})

test('multi destination transmogrify webhook', function (t) {
  t.plan(3)

  var jsonEvent = {
    configName: 'multiDestinations',
    method: "Post",
    json: input,
  }
  webhookTransmogrifier.process(jsonEvent, (results) => {
    t.equal(results.sent.length, 2, 'should be sent')
    t.same(results.sent[0].json, { city: 'Seattle', message: 'you live in Seattle' }, 'should be location')
    t.same(results.sent[1].json, { city: 'Seattle', message: 'you live in Seattle' }, 'should be location')
  }, configs)
})

test('transmogrify webhook with multi destinations and transformations', function (t) {
  t.plan(4)

  var jsonEvent = {
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
