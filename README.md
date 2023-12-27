ccload 
=================

HTTP(S) Load Tester

[Oclif](https://oclif.io)
[https://github.com/sindresorhus/got](https://github.com/sindresorhus/got)

<!-- toc -->
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ccload
$ ccload COMMAND
running command...
$ ccload (--version)
ccload/0.0.0 darwin-arm64 node-v20.9.0
$ ccload --help [COMMAND]
USAGE
  $ ccload COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ccload test https://url.com/ -n 10 -c 2`](#ccload-test-url)

## `ccload test URL`

Test URL

```
USAGE
  $ ccload test -u url -n <value> -c <value>

ARGUMENTS
  URL  url to test

FLAGS
  -u --url=<value> (required) url
  -n, --num=<value>  (required) num of request
  -c --concurrency<value> 


DESCRIPTION
  test url
  
```

_See code: [@oclif/plugin-plugins](/src/commands/test.ts)_
