nolife
======

nolife restarts an application if a file changes


Installation
------------

    npm install nolife

    
Usage
-----

    nolife <dirname_to_watch> <ext,ens,ion,s,to,wa,tch> <program> [param] [...]

Examples
--------

    nolife . . node app
    nolife views jade node app
    nolife server js,json,jade node server/app.js