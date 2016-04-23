
'use strict'

var test = require('tape');
var _ = require('underscore')

var webhookTransmogrifier = require('../webhook-transmogrifier.js')

var input = {
  "locations": [
    {"name": "Seattle", "state": "WA"},
    {"name": "New York", "state": "NY"},
    {"name": "Bellevue", "state": "WA"},
    {"name": "Olympia", "state": "WA"},
  ]
}
var configs = require('./test-configs.json')

// test('manditory properties', function (t) {
//   t.plan(1);

//   var configFor = webhookTransmogrifier.configFor.bind(webhookTransmogrifier, 'missing-manditory', configs)
//   t.throws(configFor, /destinations/, 'missing destination throws')
// });

// test('config defaults', function (t) {
//   t.plan(3);

//   var config = webhookTransmogrifier.configFor('defaults', configs)

//   t.ok(_.isArray(config.filters), 'filters default should be used')
//   t.ok(_.isArray(config.transformations), 'transformations default should be used')
//   t.ok(_.isArray(config.extractions), 'extractions default should be used')
// });

// test('simple transmogrify webhook', function (t) {
//   t.plan(3);

//   var jsonEvent = {
//     configName: 'multi-destinations',
//     method: "Post",
//     json: input,
//   }
//   webhookTransmogrifier.transmogrifyAndDeliver(jsonEvent, function(err, results) {
//     t.equal(results.sent.length, 2, 'should be sent')
//     t.same(results.sent[0].json, { city: 'Seattle', message: 'you live in Seattle' }, 'should be location')
//     t.same(results.sent[1].json, { city: 'Seattle', message: 'you live in Seattle' }, 'should be location')
//   }, configs)
// })

test('transmogrify webhook with everything', function (t) {
  t.plan(2);

  var jsonEvent = {
    configName: 'everything',
    method: "Post",
    json: input,
  }
  webhookTransmogrifier.transmogrifyAndDeliver(jsonEvent, function(err, results) {
    t.equal(results.sent.length, 1, 'should be sent')
    t.same(results.sent[0].json,
        { k: [ 'locations' ], message: 'you live in Seattle', someStates: [ 'NY', 'WA' ] },
        'should be location')
  }, configs)
})
