'use strict';

var fs = require('fs')
  , locks = {} 
  ;

module.exports =  function saveThing(file, data) {
  var lock
    ;

  lock = locks[file] = locks[file] || { count: 0, token: null, inprogress: false };
  lock.count += 1;

  if (lock.inprogress) {
    return;
  }

  if (lock.count < 10) {
    clearTimeout(lock.token);
  }

  lock.token = setTimeout(function () {
    lock.inprogress = true;
    lock.count = 0;
    fs.writeFile(file, JSON.stringify(data, null, '  '), function () {
      lock.inprogress = false;
    });
  }, 5000);
};
