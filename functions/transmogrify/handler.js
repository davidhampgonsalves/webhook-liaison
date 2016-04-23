'use strict'

var lib = require('../lib').webhook-transmogrifier

module.exports.handler = function(event, context) {
  console.log('event:', event)

  lib.transmogrifyAndDeliver(event, function callback(err, results) {
    context.done(null, {
      message: 'transmogrify!'
    })
  })
}
