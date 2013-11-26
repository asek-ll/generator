var fs = require('fs'), path = require('path'), Generators, async = require('async'), ejs = require('ejs'),
Generator;

var _ = require('lodash');

Generators = function () {
  this.cache = null;
  this.context = {};
  this.directories = [];
};

Generators.prototype.addDirectory = function(directory) {
  this.directories.push(directory);
};

Generators.prototype.addGenerator = function(name, config) {
  this.cache[name] = config;
};

Generators.prototype.addContextFile = function(fileName){
  var params, i;
  try{
    params = require(fileName);
  } catch(ex){
    return false;
  }

  this.addContext(params);
  return true;
};


Generators.prototype.addContext = function (context) {
  _.extend(this.context, context);
};

Generators.prototype.getGenerators = function(next) {
  var iterate, self=this;

  iterate = function (directory, next) {

    return fs.readdir(directory, function (err, files) {
      if(err){
        return next();
      }
      files.forEach(function (file) {
        var generator = new Generator(file, directory);
        self.addGenerator(file, generator);
      });
      return next();
    });
  };

  if(!this.cache){
    this.cache = {};
    return async.map(this.directories, iterate, function () {
      next(null, self.cache);
    });
  }
  return next(null, self.cache);

};

Generators.prototype.getGenerator = function(name, next) {
  var self = this;
  return this.getGenerators(function (err, generators) {
    if(generators[name]){
      var generator = generators[name];
      _.defaults(generator.context, self.context);
      
      return next(null, generator);
    }
    return next(new Error('Generator with this name not exists'));
  });
};

Generator = function (name, directory) {
  var defaultConfig = {
    dest: process.cwd(),
    params: [],
    copy: [{path: './copy'}]
  };
  this.directory = path.join(directory, name);
  this.config = require(path.join(this.directory, name+'.js'));
  _.defaults(this.config, defaultConfig);
  this.name = name;
  this.templateExt = ['tmpl'];
  this.context = {};
  if(this.config.context){
    _.extend(this.context, this.config.context);
  }
};

Generator.prototype.getTemplateReg = function () {
  var types = ''; 

  if(this.templateExt.length === 1){
    types = this.templateExt[0];
  }

  if(this.templateExt.length > 1){
    types = "(" + this.templateExt.join("|") + ")"; 
  }

  return new RegExp("."+types+"$");
};

Generator.prototype.getParams = function() {
  return this.config.params || [];
};

Generator.prototype.setParam = function(name, value) {
  this.context[name] = value;
};

Generator.prototype.run = function(next) {
  this.copy(path.join(this.directory, 'copy'), this.config.dest, function () {
    return next();
  });
};

Generator.prototype.processFilename = function(name) {
  var param;
  name = name.replace(this.getTemplateReg(),'');

  for(param in this.context){
    if(this.context.hasOwnProperty(param)){
      name = name.replace(new RegExp("__"+param+"__",'g'), this.context[param]);
    }
  }

  return name;
};

Generator.prototype.copy = function (sourceDir, targetDir, next) {
  var self = this;
  return fs.readdir(sourceDir, function (err, files) {
    if(err){
      return next();
    }

    var iterate;

    iterate = function (file, next) {
      var fileName = path.join(sourceDir, file);
      return fs.stat(fileName, function (err, stats) {
        if(err){
          return next();
        }

        var newName = path.join(targetDir, self.processFilename(file));

        if(stats.isDirectory()){
          return fs.mkdir(newName, function (err) {
            return self.copy(fileName, newName, function () {
              return next();
            });
          });
        }

        if(stats.isFile()){
          if(self.getTemplateReg().test(file)){
            return self.processFile(fileName, newName, function (err) {
              return next();
            });
          }

          return self.copyFile(fileName, newName, function (err) {
            return next();
          });
        }

      });
    };

    return async.map(files, iterate, function () {
      return next();
    });
  });
};


Generator.prototype.copyFile = function(source, target, next) {
  var cbCalled = false, rd, wr, done;

  done = function(err) {
    if (!cbCalled) {
      cbCalled = true;
      return next(err);
    }
  };
  rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);
};


Generator.prototype.processFile = function(source, target, next) {
  var self = this;

  return fs.readFile(source, {encoding: 'utf8'}, function (err, template) {
    if (err) {
      return next(err);
    }
    var rendered = ejs.render(template, self.context);

    return fs.writeFile(target, rendered, function (err) {
      return next(err);
    });

  });
};

module.exports = new Generators();
