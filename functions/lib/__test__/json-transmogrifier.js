'use strict'

const test = require('tape');
const _ = require('underscore')
require('json5/lib/require')

const webhookTransmogrifier = require('..').webhookTransmogrifier
const jsonTransmogrifier = require('..').jsonTransmogrifier

const input = {
  "locations": [
    {"name": "Seattle", "state": "WA"},
    {"name": "New York", "state": "NY"},
    {"name": "Bellevue", "state": "WA"},
    {"name": "Olympia", "state": "WA"},
  ]
}
const configs = require('./test-configs.json5')

test('single transformation', function (t) {
  t.plan(2);

  const config = webhookTransmogrifier.configFor('singleTransformation', configs)
  const output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"].length, 4, 'transformation maintains existing content')
})

test('empty extraction clears', function (t) {
  t.plan(1);

  const config = webhookTransmogrifier.configFor('emptyExtraction', configs)
  const output = jsonTransmogrifier.transmogrify(config, input, input)

  t.deepEqual(output, {}, 'empty extraction clears')
})

test('multi transformation', function (t) {
  t.plan(2);

  const config = webhookTransmogrifier.configFor('multiTransformation', configs)
  const output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"], '', 'transformation maintains existing content')
})

test('single filter', function (t) {
  t.plan(1);

  const config = webhookTransmogrifier.configFor('singleFilter', configs)
  const filter = jsonTransmogrifier.filter(config, input)

  t.ok(!!filter, 'should be filtered')
})

test('single filter', function (t) {
  t.plan(1);

  const config = webhookTransmogrifier.configFor('multiFilter', configs)
  const filter = jsonTransmogrifier.filter(config, input)

  t.ok(!!filter, 'should be filtered')
})

test('single filter pass', function (t) {
  t.plan(1);

  const config = webhookTransmogrifier.configFor('singleFilterPass', configs)
  const filter = jsonTransmogrifier.filter(config, input)

  t.ok(!filter, 'should not be filtered')
})

test('bad jmespath should return errors', function (t) {
  t.plan(1);

  const config = { filters: [1], extractions: [], transformations: []}
  const errs = jsonTransmogrifier.validateConfig(config)

  t.equals(errs.length, 2, 'should have errors re: invalid jmespath and bad data type')
})

