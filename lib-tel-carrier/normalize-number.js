'use strict';

module.exports =  function normalizeNumber(number) {
  //var valNum = String(number).match(/(?=\+?1)?(\d{10})$/)
  var valNum = /(?=\+?1)?(\d{10})$/.exec(String(number))
    ;

  return valNum && ('+1' + valNum[1]);
};
