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
  let v = ''
  setTimeout(() => cb(new Error('Request tock too long')), 10 * 1000)
  let done = false
  socket.on('data', (data) => {
    if (done) {
      return
    }
    if (v.length > 100) {
      done = true
      return cb(new Error('Request too long'))
    }
    v += data
    if (v.endsWith(END)) {
      v = v.replace(END, '')
      done = true
      return cb(null, {domain: v})
    }
  })
  socket.on('end', () => {
    if (!done) { // previous ts3 clients use an old non-v6 fmt that terminates on close
      done = true
      return cb(null, {domain: v, oldFmt: true})
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
  }
  return {found: match, return: match.value.join(',')}
}

module.exports = {
  loadSettings,
  readRequest,
  match
}
