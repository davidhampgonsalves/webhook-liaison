'use strict'

const test = require('tape')
const _ = require('underscore')

const log = require('../logger.js')

test('formatter prints nested objects', function (t) {
  t.plan(1)
  t.ok(log.frmt({ asdf: [{deep: { nested: 2}}, 2, 3] }).match(/nested/), 'prints deeply nested properties')
})

test('prints errors and config', function (t) {
  t.plan(2)

  const errs = ['one error', 'two error', 'three error']
  const logged = log.errorsFor('bad-config', errs)

  t.ok(logged.match(/bad-config/), 'prints config name')
  t.ok(logged.match(/three error/), 'prints last error')
})
