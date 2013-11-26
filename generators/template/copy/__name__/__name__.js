var params, files, copy;

params = [
  {name:'param', title:'Param title', pattern:'^[0-9]+$', 'default':  Math.floor(Math.random()*1000)}
];


module.exports = {
  params: params
};
