#!/usr/bin/env node 

var generator = require('./lib/generator.js'), 
  path = require('path'), 
  async = require('async'),
  _ = require('lodash'),
  readline = require('readline'), rl;

var optimist = require('optimist')
.usage('use it')
.options('l', {
  alias : 'list',
  describe: 'show available templates'
})
.options('t', {
  alias : 'template',
  describe: 'execute template in these directory'
});

var argv = optimist.argv;

generator.addDirectory(path.join(process.env.HOME, 'generators'));
generator.addDirectory(path.join(process.cwd(), 'generators'));
generator.addContext(path.join(process.env.HOME, 'generators','default.js'));

if(argv.l){
  generator.getGenerators(function (err, path) {
    _.each(_.keys(path), function (path) {
      console.log(path);
    });
  });
} else if(argv.t) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  generator.getGenerator(argv.t, function (err, gen) {
    if(err){
      rl.close();
      return console.log(err);
    }
    var params = gen.getParams(), iterate;

    iterate = function (param, next) {

      if(argv[param.name]){
        gen.setParam(param.name, argv[param.name]);
        return next();
      }

      return rl.question(param.title+'('+param.name+'): ', function (val) {
        var reg;
        if(param.pattern){
          reg = new RegExp(param.pattern);
          if(!reg.test(val)){
            console.log(param.title, 'must be', param.pattern);
            return iterate(param, next);
          }
        }
        gen.setParam(param.name, val);
        return next();
      });
    };

    return async.map(params, iterate, function () {
      return gen.run(function () {
        rl.close();
      });
    });
  });

} else {
  optimist.showHelp();
}
