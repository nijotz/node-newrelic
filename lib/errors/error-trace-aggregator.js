'use strict'

const logger = require('../logger').child({component: 'error_tracer'})
const TraceAggregator = require('../aggregators/trace-aggregator')

// TODO: do traces ever have differing algorithms or
// always first-come? If same, can standardize in TraceAggregator
// Otherwise, TraceAggregator may not be a thing
class ErrorTraceAggregator extends TraceAggregator {
  constructor(opts, collector) {
    opts = opts || {}
    opts.method = opts.method || 'error_data'

    super(opts, collector)

    this.errors = []
  }

  add(error) {
    if (this.errors.length < this.limit) {
      logger.debug(error, 'Error to be sent to collector.')
      this.errors.push(error)
    } else {
      logger.debug(
        'Already have %d errors to send to collector, not keeping.', this.limit)
    }
  }

  toPayloadSync() {
    if (this.errors.length > 0) {
      return [this.runId, this.errors]
    }

    logger.debug('No error traces to send.')
  }

  getData() {
    return this.errors
  }

  merge(errors) {
    if (!errors) {
      return
    }

    const len = Math.min(errors.length, this.limit - this.errors.length)
    logger.warn('Merging %s (of %s) errors for next delivery.', len, errors.length)

    for (var i = 0; i < len; i++) {
      this.errors.push(errors[i])
    }
  }

  clear() {
    this.errors = []
  }
}

module.exports = ErrorTraceAggregator