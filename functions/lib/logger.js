'use strict'

const util = require('util')
const _ = require('underscore')

module.exports.log = function log() {
  args = Array.prototype.slice.call(arguments)
  args = args.reduce((msg) => typeof(msg) === 'string' ? msg : exports.frmt(msg), [])
  console.log(args.join('\n'))
}

module.exports.logAll = function logAll(msgLines) {
  console.log(msgLines.join('\n'))
}

module.exports.errorsFor = function errorsFor(configName, errs) {
  errs = [`configuration ${configName} has issues:`].concat(errs)
  exports.errors(errs)
}

module.exports.errors = function errors(errs) {
  exports.logAll(errs)
}

module.exports.frmt = function frmt(obj) {
  return util.inspect(obj, {depth: 4, colors: true})
}
