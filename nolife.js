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

function log () {
  var args = [].slice.call(arguments)
  //args.unshift(new Date().toUTCString())
  console.log.apply(console, args)
}

var argv = process.argv.slice(2), arg

if (argv.length === 0) {
  var help = [
    'Usage: nolife [options] <program> [params]'
  , ''
  , '  program ....... Executable program'
  , '  params ........ Optional parameters'
  , ''
  , 'Options:'
  , ''
  , '  -d, --dir ..... Directory name to watch [.]'
  , '  -e, --ext ..... Extensions to watch [js,json]'
  ].join('\n')
  log(help)
  process.exit()
}

log([
  '+------+'
, ' nolife '
, '+------+'
].join('\n'))

argv.params = []
argv.dir = '.'
argv.ext = 'js,json'

if (argv.length === 1) {
  argv.program = 'node'
  argv.params = [ argv[0] ]
} else {
  while (arg = argv.shift()) {
    if (arg == '-d' || arg == '--dir') argv.dir = argv.shift()
    else if (arg == '-e' || arg == '--ext') argv.ext = argv.shift()
    else if (!argv.program) argv.program = arg
    else argv.params.push(arg)
  }
}

process.title = 'node nolife ' + argv.join(' ')

var extensions = argv.ext.toLowerCase().split(',')
log('Watching extensions:', extensions[0] == '.' ? '*' : '.' + extensions.join(' .'))

;(function respawn (app) {
  var restartTimeout
    , filename = path.join(process.cwd(), app.dir)
    , dirname = path.resolve(filename)
    , args = app.params

  ;(function cleanWatch () {
    var watcher, n = 0
    while (watcher = watched.pop()) {
      n++
      watcher.close()
    }
    if (n) log('Closed fs watchers')
  }())

  function kill () {
    try {
      proc.kill()
    } catch(e) {
      log('Can\'t kill process')
      log(e)
    }
  }

  function restart (ms) {
    clearTimeout(restartTimeout)
    restartTimeout = setTimeout(function () {
      restartTimeout = null
      kill()
    }, ms)
  }

  Walker(dirname)
    .on('file', function (file) {
      if (!~extensions.indexOf(path.extname(file).slice(1).toLowerCase()) && !~extensions.indexOf('.')) return
      try {
        var watcher = fs.watch(file, function (event, filename) {
          if (event === 'change' && !restartTimeout) {
            if (filename) {
              log('!!! Changed:', filename)
              log(file)
            }
            log('Exiting in 2 seconds...')
            restart(2000)
          }
        })
        watched.push(watcher)
      } catch (_) {}
    })
    .on('error', function(er, target, stat) {
      log('got error ' + er + ' on target ' + target)
    })

  log('Watching dir:', dirname)
  log('Starting:', app.program, args.join(' '))

  try {
    proc = child_process.spawn(app.program, args)
  } catch(e) {
    log('*** Failed to run', app.join(' '), '\n', util.inspect(e))
    log('Trying again in 2 seconds...')
    return setTimeout(function() {
      respawn(app)
    }, 2000)
  }

  log('-----------------------------')

  proc.stdout.on('data', function (data) {
    process.stdout.write(data)
  })

  proc.stderr.on('data', function (data) {
    process.stderr.write(data)
  })

  proc.on('exit', function (err, sig) {
    log('Process exited')
    if (err) {
      log('    with error:', err, sig)
      if (err == 127) {
        console.log('Not executable, retrying with node')
        app.params.unshift(app.program)
        app.program = 'node'
        return setTimeout(function () {
          respawn(app)
        }, 500)
      }
    }
    log('Restarting in 2 seconds...')
    setTimeout(function() {
      respawn(app)
    }, 2000)
  })

}(argv))