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
      errs.push(`${operationType} "${operations}" should be an array not ${typeof(operations)}.`)
      return
    }

    operations.forEach((operation) => {
      const properType = operationType === 'filters' ? 'string' : 'object'
      if(typeof(operation) !== properType) {
        errs.push(`${operationType} contains ${typeof(operation)} but should be ${properType} > ${operation}`)
        return
      }

      if(operationType === 'filters') {
        const err = validateJmesPath('filters', operation)
        err && errs.push(err)
      } else {
        _.each(operation, (path, key) => {
          const err = validateJmesPath(operationType, path, key)
          err && errs.push(err)
        })
      }
    })
  })

  return errs
}

function validateJmesPath(operationType, path, element) {
  try {
    jmespath.compile(path)
  } catch(err) {
    return `${operationType} "${log.frmt(path)}"${element ? ' for ' + element : ''} caused error: ${log.frmt(err)}.`
  }
  return
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

function transmogrify(config, actionName, input, output) {
  if(config[actionName].length === 0)
    return input

  config[actionName].forEach((action) => {
    _.each(action, (expression, key) => {
      try {
        output[key] = jmespath.search(input, expression)
      } catch(err) {
        throw new Error(`${err} occured durring ${action} ${log.frmt(expression)} for input: ${log.frmt(input)}`)
      }
    })
  })

  return output
}
