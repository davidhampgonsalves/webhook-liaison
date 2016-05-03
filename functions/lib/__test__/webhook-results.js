'use strict'

const test = require('tape')

const Results = require('../webhook-results.js')

const destination = { method: 'GET', url: 'http://asdf.com' }
const json = {}
const options = { auth: {} }
const filter = 'asdf'
const error = { statusCode:404, response: 'asdf' }

test('formatter prints nested objects', function (t) {
  t.plan(2)

  const r1 = new Results('asdf')
  const r2 = new Results('asdf')

  r1.addFiltered(destination, json, filter)
  r2.addFiltered(destination, json, filter)

  r2.addDeliveryError(destination, json, error)

  r1.merge(r2)

  debugger
  t.equals(r1.filtered.length, 2, 'should have both filters')
  t.equals(r1.deliveryErrors.length, 1, 'should r2\'s error')
})

test('formatter prints nested objects', function (t) {
  t.plan(9)

  const r = new Results('asdf')

  r.addFiltered(destination, json, filter)
  r.addDeliveryDetails(destination, json, options)
  r.addDeliveryError(destination, json, error)
  r.addErrors(['err1', 'err2'])

  t.equals(r.filtered.length, 1, 'should have filter')
  t.equals(r.sent.length, 1, 'should have sent')
  t.equals(r.deliveryErrors.length, 1, 'should have error')

  const logged = r.log()
  t.ok(logged.match(/filtered/), 'should have filter section')
  t.ok(logged.match(/sent/), 'should have sent section')
  t.ok(logged.match(/deliveryErrors/), 'should have errors section')
  t.ok(logged.match(/errors/), 'should have errors section')
  t.ok(logged.match(/asdf/), 'should have config name section')
  t.ok(logged.match(/err1/), 'should print error msg')
})
