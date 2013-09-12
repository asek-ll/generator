var program = require('commander'),
  generator = require('./lib/generator.js'), 
  path = require('path'), 
  async = require('async'),
  readline = require('readline'), rl;


generator.addDirectory(path.join(process.env.HOME, 'generators'));
generator.addContext(path.join(process.env.HOME, 'generators','default.js'));


program.version('0.0.1');

program
.command('list')
.description('run setup commands for all envs')
.action(function () {
  generator.getGenerators(function (err, path) {
    console.log(path);
  });
});

program
.command('run [name]')
.description('run generator')
.action(function (name) {

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return generator.getGenerator(name, function (err, gen) {
    if(err){
      return console.log(err);
    }
    var params = gen.getParams(), iterate;

    iterate = function (param, next) {

      if(program[param.name]){
        gen.setParam(param.name, program[param.name]);
        return next();
      }

      return rl.question(param.title+': ', function (val) {
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
});


program.parse(process.argv);
