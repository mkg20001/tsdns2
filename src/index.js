'use strict'

const once = require('once')
const glob = require('minimatch')

const END = '\n\r\r\r\n'

function loadSettings (content) {
  return content.split('\n').filter(l => !l.trim().startsWith('#') && l.trim()).map(l => {
    let [domain, value] = l.split('=')
    return {domain, value: value.split(' ')}
  })
}

function readRequest (socket, cb) {
  cb = once(cb)
  socket.setEncoding('utf8')
  socket.setNoDelay(true)
  socket.setTimeout(1000)

  let done = false

  socket.once('data', (data) => {
    let domain = String(data)
    let oldFmt = true

    if (domain.endsWith(END)) {
      oldFmt = false
      domain = domain.replace(END, '')
    }

    done = true

    return cb(null, {domain, oldFmt})
  })

  socket.once('timeout', () => {
    if (!done) {
      done = true
      return cb(new Error('Timeout'))
    }
  })
  socket.once('timeout', () => socket.destroy())
  socket.once('error', (err) => {
    if (!done) {
      done = true
      return cb(err)
    }
  })
  socket.once('close', () => {
    if (!done) {
      done = true
      return cb(new Error('Socket closed before request could be reaad'))
    }
  })
}

function match (settings, req) {
  let match = settings.filter(s => glob(req.domain, s.domain))[0]
  if (!match) {
    return {found: false, return: '404'}
  }
  if (req.oldFmt) {
    let firstV4 = match.value.filter(s => s.match(/^\d+\.\d+\.\d+\.\d+(:.+)*$/))[0]
    if (!firstV4) {
      return {found: match, return: '404'}
    }
    return {found: match, return: firstV4}
  }
  return {found: match, return: match.value.join(',')}
}

module.exports = {
  loadSettings,
  readRequest,
  match
}
