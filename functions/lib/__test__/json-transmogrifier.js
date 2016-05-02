'use strict'

const test = require('tape');
const _ = require('underscore')
require('json5/lib/require')

const webhookTransmogrifier = require('..').webhookTransmogrifier
const jsonTransmogrifier = require('..').jsonTransmogrifier
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

test('single transformation', function (t) {
  t.plan(2);

  const config = webhookConfig.configFor('singleTransformation', configs)
  const output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'the city of Seattle', 'single transformation concat')
  t.equal(output["locations"].length, 4, 'transformation maintains existing content')
})

test('empty extraction clears', function (t) {
  t.plan(1);

  const config = webhookConfig.configFor('emptyExtraction', configs)
  const output = jsonTransmogrifier.transmogrify(config, input, input)

  t.deepEqual(output, {}, 'empty extraction clears')
})

test('multi transformation', function (t) {
  t.plan(2);

  const config = webhookConfig.configFor('multiTransformation', configs)
  const output = jsonTransmogrifier.transmogrify(config, input, input)

  t.equal(output["message"], 'you live in Seattle', 'single transformation concat')
  t.equal(output["locations"], '', 'transformation maintains existing content')
})

test('single filter', function (t) {
  t.plan(1);

  const config = webhookConfig.configFor('singleFilter', configs)
  const filter = jsonTransmogrifier.filter(config, input)

  t.ok(!!filter, 'should be filtered')
})

test('single filter', function (t) {
  t.plan(1);

  const config = webhookConfig.configFor('multiFilter', configs)
  const filter = jsonTransmogrifier.filter(config, input)

  t.ok(!!filter, 'should be filtered')
})

test('single filter pass', function (t) {
  t.plan(1);

  const config = webhookConfig.configFor('singleFilterPass', configs)
  const filter = jsonTransmogrifier.filter(config, input)

  t.ok(!filter, 'should not be filtered')
})

test('bad data type should return errors', function (t) {
  t.plan(1);

  const config = { filters: [1], extractions: ["asdf"], transformations: []}
  const errs = jsonTransmogrifier.validateConfig(config)

  t.ok(errs[0].match(/number/), 'should have errors re: bad data type')
})

test('bad jmespath should return errors', function (t) {
  t.plan(1);

  const config = { filters: [], extractions: [{asdf: "safd`", fdsa: "asdf"}], transformations: []}
  const errs = jsonTransmogrifier.validateConfig(config)

  t.ok(errs[0].match(/asdf/), 'should have errors re: bad data type')
})
