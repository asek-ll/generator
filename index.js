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
})
.options('f', {
  alias : 'force',
  describe: 'use defaults if possible'
});

var argv = optimist.argv;

generator.addDirectory(path.join(__dirname, 'generators'));

generator.addDirectory(path.join(process.env.HOME, 'generators'));

generator.addContext(process.env);
generator.addContextFile(path.join(process.env.HOME, 'generators','default.js'));

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

      if(argv.f){
        if(param['default']){
          gen.setParam(param.name,param['default']);
          return next();
        }
      }

      var caption = param.title+' ('+param.name+')';
      if(param['default']){
        caption+='['+param['default']+']:';
      } else {
        caption+=':';
      }

      return rl.question(caption, function (val) {
        var reg;
        if(val === '' && param['default']){
          val = param['default'];
        }
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

    return async.mapSeries(params, iterate, function () {
      return gen.run(function () {
        rl.close();
      });
    });
  });

} else {
  optimist.showHelp();
}
