#!/usr/bin/env node

'use strict'

const net = require('net')
const log = require('pino')({name: 'tsdns'})
const fs = require('fs')

const {loadSettings, readRequest, match} = require('.')

const argv = require('yargs')
  .option('config', {
    alias: 'c',
    default: 'tsdns_settings.ini',
    desc: 'Path to TSDNS config file'
  })
  .option('no-watch', {
    alias: 'n',
    desc: 'Disable watching'
  })
  .option('port', {
    alias: 'p',
    default: 41144,
    type: 'number',
    desc: 'Port to listen on'
  })
  .option('host', {
    alias: 'h',
    default: '0.0.0.0',
    desc: 'Host to listen on'
  })
  .argv

const settings = argv.config
let lSettings = []

if (!fs.existsSync(settings)) {
  log.error({file: settings}, 'Config file %s not found!', settings)
  return process.exit(2)
}

const server = net.createServer(socket => readRequest(socket, (err, req) => {
  if (err) {
    return log.error(err, 'Invalid request')
  }
  let res = match(lSettings, req)
  log.info({req, res}, 'Done')
  socket.write(res.return, () => socket.end())
}))

server.listen(argv, (err) => {
  if (err) {
    log.error(err, 'Listen failed')
    return process.exit(2)
  }
  log.info(server.address(), 'Ready')
})

function load () {
  log.info('Reloading %s...', settings)
  try {
    lSettings = loadSettings(String(fs.readFileSync(settings)))
  } catch (e) {
    return log.error(e, 'Loading settings failed!')
  }
  log.info('Total of %s host(s) found!', lSettings.length)
}

load()

if (!argv.n) {
  fs.watch(settings, load)
}
