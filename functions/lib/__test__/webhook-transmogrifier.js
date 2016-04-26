'use strict'

var test = require('tape')
var _ = require('underscore')
require('json5/lib/require')

var webhookTransmogrifier = require('../webhook-transmogrifier.js')

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
  t.plan(1)

  var configFor = webhookTransmogrifier.configFor.bind(webhookTransmogrifier, 'missingManditory', configs)
  t.throws(configFor, /destinations/, 'missing destination throws')
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
