# nolife

nolife restarts an application if a file changes

## Installation

`npm install nolife -g`

## Usage

```
Usage: nolife [options] <program> [params]

  program ....... Executable program
  params ........ Optional parameters

Options:

  -d, --dir ..... Directory name to watch [.]
  -e, --ext ..... Extensions to watch [js,json]
```

## Examples

```
$ nolife app.js

$ nolife app.js -e js,jade

$ nolife node app.js -d mydir
```
