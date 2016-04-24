'use strict'

var test = require('tape');
var _ = require('underscore')
require('json5/lib/require')

var webhookTransmogrifier = require('..').webhookTransmogrifier
var jsonTransmogrifier = require('..').jsonTransmogrifier


//todo
// test empty extraction results in empty output
// test extract / fileter / transform at destination level
// test bad configs
//   filter, transformation, extraction not array
//   ^ not valid jmes path

var input = {
  "locations": [
    {"name": "Seattle", "state": "WA"},
    {"name": "New York", "state": "NY"},
    {"name": "Bellevue", "state": "WA"},
    {"name": "Olympia", "state": "WA"},
  ]
}
var configs = require('./test-configs.json5')

test('single transformation', function (t) {
  t.plan(2);

  var config = webhookTransmogrifier.configFor('singleTransformation', configs)
  var output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"].length, 4, 'transformation maintains existing content')
})

test('multi transformation', function (t) {
  t.plan(2);

  var config = webhookTransmogrifier.configFor('multiTransformation', configs)
  var output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"], '', 'transformation maintains existing content')
})

test('single filter', function (t) {
  t.plan(1);

  var config = webhookTransmogrifier.configFor('singleFilter', configs)
  var wasFiltered = jsonTransmogrifier.transmogrify(config, input, input) === null

  t.ok(wasFiltered, 'should be filtered')
})

test('single filter', function (t) {
  t.plan(1);

  var config = webhookTransmogrifier.configFor('multiFilter', configs)
  var wasFiltered = jsonTransmogrifier.transmogrify(config, input, input) === null

  t.ok(wasFiltered, 'should be filtered')
})

test('single filter pass', function (t) {
  t.plan(1);

  var config = webhookTransmogrifier.configFor('singleFilterPass', configs)
  var wasFiltered = jsonTransmogrifier.transmogrify(config, input, input) === null

  t.ok(!wasFiltered, 'should not be filtered')
})
