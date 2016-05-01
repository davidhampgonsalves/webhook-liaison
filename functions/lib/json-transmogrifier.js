'use strict'

const fs = require('fs')
const _ = require('underscore')
const jmespath = require('jmespath')

const log = require('./logger.js')

module.exports.CONFIG_DEFAULTS = {
  filters: [],
  transformations: [],
  extractions: [],
}

module.exports.validateConfig = function validateConfig(config) {
  const errs = []

  const operationTypes = ['filters', 'extractions', 'transformations']
  operationTypes.forEach((operationType) => {
    var operations = config[operationType]

    if(!_.isArray(operations)) {
      errs.push(`${operationType} "${operations}" should be an array.`)
      return
    }

    operations.forEach((operation) => {
      if(typeof(operation) != 'string')
        errs.push(`$(operationType) contains non-string(${typeof(operation)}) data: ${operation}`)

      try {
        jmespath.compile(operation)
      } catch(err) {
        errs.push(`${operationType} "${operation}" is not valid JMESPath.`)
      }
    })
  })

  return errs
}

module.exports.filter = function filter(config, input) {
  const filters = config["filters"]

  for(var i=0, len=filters.length ; i < len ; i++) {
    var f = filters[i]
    try {
      if(!jmespath.search(input, f)) {
        return f
      }
    } catch(err) {
      throw new Error(`${err} occured for filter:
        ${log.frmt(f)}
        for input:
        ${log.frmt(input)}`)
    }
  }

  return null
}

module.exports.transmogrify = function transmogrify(config, json) {
  json = transform(config, json)
  return extract(config, json)
}

function transform(config, input) {
  var output = JSON.parse(JSON.stringify(input))
  return transmogrify(config, "transformations", input, output)
}

function extract(config, input) {
  return transmogrify(config, "extractions", input, {})
}

function transmogrify(config, action, input, output) {
  if(config[action].length === 0)
    return input

  config[action].forEach((expression) => {
    try {
      _.extend(output, jmespath.search(input, expression))
    } catch(err) {
      throw new Error(`${err} occured for ${action}:
        ${log.frmt(expression)}
        for input:
        ${log.frmt(input)}`)
    }
  })

  return output
}
