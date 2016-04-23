'use strict'

var test = require('tape');
var _ = require('underscore')

var webhookTransmogrifier = require('..').webhookTransmogrifier
var jsonTransmogrifier = require('..').jsonTransmogrifier


//todo
// test empty extraction results in empty output
// test each transformation, extraction config item is an object
// test each filter is a ... string?

var input = {
  "locations": [
    {"name": "Seattle", "state": "WA"},
    {"name": "New York", "state": "NY"},
    {"name": "Bellevue", "state": "WA"},
    {"name": "Olympia", "state": "WA"},
  ]
}
var configs = require('./test-configs.json')

test('single transformation', function (t) {
  t.plan(2);

  var config = webhookTransmogrifier.configFor('single-transformation', configs)
  var output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"].length, 4, 'transformation maintains existing content')
})

test('multi transformation', function (t) {
  t.plan(2);

  var config = webhookTransmogrifier.configFor('multi-transformation', configs)
  var output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"], '', 'transformation maintains existing content')
})

test('single filter', function (t) {
  t.plan(1);

  var config = webhookTransmogrifier.configFor('single-filter', configs)
  var wasFiltered = jsonTransmogrifier.transmogrify(config, input, input) === null

  t.ok(wasFiltered, 'should be filtered')
})

test('single filter', function (t) {
  t.plan(1);

  var config = webhookTransmogrifier.configFor('multi-filter', configs)
  var wasFiltered = jsonTransmogrifier.transmogrify(config, input, input) === null

  t.ok(wasFiltered, 'should be filtered')
})

test('single filter pass', function (t) {
  t.plan(1);

  var config = webhookTransmogrifier.configFor('single-filter-pass', configs)
  var wasFiltered = jsonTransmogrifier.transmogrify(config, input, input) === null

  t.ok(!wasFiltered, 'should not be filtered')
})
