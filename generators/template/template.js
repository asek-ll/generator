var params, files, copy;
var path = require('path');

params = [
  {name:'name', title:'Имя шаблона', pattern:'^[A-Za-z][A-Za-z_0-9]+$'}
];

module.exports = {
  params: params,
  dest: path.join(process.env.HOME, 'generators')
};
