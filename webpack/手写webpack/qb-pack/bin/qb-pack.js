#! /usr/bin/env node

// 1）拿到webpack.config.js

let path = require("path");

let Compiler = require('../lib/Compiler');

let config = require(path.resolve('webpack.config.js'));


let compiler = new Compiler(config);

compiler.run();