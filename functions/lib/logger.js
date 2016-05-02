'use strict'

const util = require('util')

module.exports.logAll = function logAll(msgLines) {
  const output = msgLines.join('\n')
  console.log(output)
  return output
}

module.exports.errorsFor = function errorsFor(configName, errs) {
  errs = [`configuration ${configName} has issues:`].concat(errs)
  return exports.errors(errs)
}

module.exports.errors = function errors(errs) {
  return exports.logAll(errs)
}

module.exports.frmt = function frmt(obj) {
  return util.inspect(obj, {depth: 4, colors: true})
}
