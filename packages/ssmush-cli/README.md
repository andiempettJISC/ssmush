ssmush-cli
==========

A CLI to add secrets to AWS SSM Parameter Store with ssmush

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ssmush-cli.svg)](https://npmjs.org/package/ssmush-cli)
[![Downloads/week](https://img.shields.io/npm/dw/ssmush-cli.svg)](https://npmjs.org/package/ssmush-cli)
[![License](https://img.shields.io/npm/l/ssmush-cli.svg)](https://github.com/androidwiltron/ssmush-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ssmush-cli
$ ssmush-cli COMMAND
running command...
$ ssmush-cli (-v|--version|version)
ssmush-cli/0.0.13 darwin-x64 node-v16.13.1
$ ssmush-cli --help [COMMAND]
USAGE
  $ ssmush-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ssmush-cli hello`](#ssmush-cli-hello)
* [`ssmush-cli help [COMMAND]`](#ssmush-cli-help-command)

## `ssmush-cli hello`

```
USAGE
  $ ssmush-cli hello

OPTIONS
  --stage=staging|test|dev|prod
```

_See code: [lib/commands/hello.js](https://github.com/androidwiltron/ssmush-cli/blob/v0.0.13/lib/commands/hello.js)_

## `ssmush-cli help [COMMAND]`

display help for ssmush-cli

```
USAGE
  $ ssmush-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_
<!-- commandsstop -->
