var params, files, copy;

params = [
  {name:'name', title:'Имя шаблона', pattern:'^[A-Za-z][A-Za-z_0-9]+$'}
];

var destPath = function () {
  //return path.join(process.env.HOME, 'generators');
};


module.exports = {
  params: params
};
