#!/usr/bin/env node
//
// nolife.js
// by stagas
//
// MIT licenced
//

var util = require('util')
  , fs = require('fs')
  , path = require('path')
  , child_process = require('child_process')
  , Walker = require('walker')
  , proc
  , watched = []
  
if (process.argv.length <= 4) {
  console.log('usage: nolife <dirname_to_watch> <ext,ens,ion,s,to,wa,tch> <program> [param] [...]')
  process.exit()
}

process.title = 'nolife ' + process.argv.slice(2).join(' ')

function log() {
  var args = [].slice.call(arguments)
  args.unshift(new Date().toDateString(), new Date().toLocaleTimeString())
  console.log.apply(console, args)
}

var extensions = process.argv[3].toLowerCase().split(',')
log('watching extensions:', extensions[0] == '.' ? '*' : '.' + extensions.join(' .'))

;(function respawn(app) {
  var restartTimeout
    , filename = path.join(process.cwd(), app[0])
    , dirname = path.resolve(filename)
    , args = app.slice(3)

  ;(function cleanWatch() {
    var file
    while (file = watched.pop()) {
      fs.unwatchFile(file)
    }
  }())

  function kill() {
    try {
      proc.kill('SIGHUP')
    } catch(e) {
      log('could not kill process')
      console.dir(e)
    }
  }

  function restart(ms) {
    clearTimeout(restartTimeout)
    restartTimeout = setTimeout(function() {
      kill()
    }, ms)
  }

  Walker(dirname)
    .on('file', function(file) {
      if (!~extensions.indexOf(path.extname(file).slice(1).toLowerCase()) && !~extensions.indexOf('.')) return
      watched.push(file)
      fs.watchFile(file, function(curr, prev) {
        if (+curr.mtime !== +prev.mtime) {
          log('changed:', file)
          log('exiting in 2 seconds...')
          restart(2000)
        }
      })
    })
    .on('error', function(er, target, stat) {
      log('got error ' + er + ' on target ' + target)
    })

  log('watching dir:', dirname)
  log('starting:', app[2], args.join(' '))

  try {
    proc = child_process.spawn(app[2], args)
  } catch(e) {
    log('failed to run', app.join(' '), '\n', util.inspect(e))
    log('trying again in 2 seconds...')
    return setTimeout(function() {
      respawn(app)
    }, 2000)
  }

  log('\n\n--started--\n')

  proc.stdout.on('data', function (data) {
    process.stdout.write(data)
  })

  proc.stderr.on('data', function (data) {
    util.print(data)
  })

  proc.on('exit', function (err, sig) {
    if (err) {
      log('process exited with error:', err, sig)
      log('restarting in 2 seconds...')
      setTimeout(function() {
        respawn(app)
      }, 2000)
    } else {
      log('process exited gracefully')
      log('restarting in 2 seconds...')
      setTimeout(function() {
        respawn(app)
      }, 2000)
    }
  })

}(process.argv.slice(2)))