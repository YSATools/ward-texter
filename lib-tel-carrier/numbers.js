'use strict';

var Numbers = {}
  , normalizeNumber = require('./normalize-number')
  , saveThing = require('./save-thing')
  , path = require('path')
  ;

Numbers._data = require('./numbersdb.json');
Numbers._save = function () {
  saveThing(path.join(__dirname, 'numbersdb.json'), Numbers._data);
};
Numbers.update = function (number, carrier, wireless) {
  number = normalizeNumber(number);
  if (!number) {
    return;
  }

  if ((null !== typeof carrier && undefined !== carrier && 'string' !== typeof carrier) || carrier.length > 100) {
    return;
  }

  var n = Numbers._data[number]
    ;

  if (!n) {
    n = {};
    Numbers._data[number] = n;
  }
  
  if (!n.wireless || wireless) {
    n.updated = Date.now();
    n.wireless = wireless;
  }

  if (!n.carrier || carrier) {
    n.carrier = carrier || n.carrier;
    n.updated = Date.now();
  }

  Numbers._save();
};

module.exports = Numbers;
