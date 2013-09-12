module.exports = {
  date: function(format, date,  utc){

    date = date || new Date();
    utc = utc ? 'getUTC' : 'get';

    return format.replace (/%[YmdHMS]/g, function (m) {
      switch (m) {
        case '%Y': return date[utc + 'FullYear'] ();
        case '%m': m = 1 + date[utc + 'Month'] (); break;
        case '%d': m = date[utc + 'Date'] (); break;
        case '%H': m = date[utc + 'Hours'] (); break;
        case '%M': m = date[utc + 'Minutes'] (); break;
        case '%S': m = date[utc + 'Seconds'] (); break;
        default: return m.slice (1); 
      }
      return ('0' + m).slice (-2);
    });
  }

};
