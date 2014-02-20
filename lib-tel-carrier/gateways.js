'use strict';

var Gateways = {}
  , saveThing = require('./save-thing')
  , path = require('path')
  ;

Gateways._data = require('./gatewaysdb.json');
Gateways._save = function () {
  saveThing(path.join(__dirname, 'gatewaysdb.json'), Gateways._data);
};
Gateways.update = function (carrier, sms, mms) {
  if (null !== sms && undefined !== sms && 'string' !== typeof sms) {
    return;
  }

  if (null !== mms && undefined !== mms && 'string' !== typeof mms) {
    return;
  }

  var gw = Gateways._data[carrier]
    ;

  if (!gw) {
    gw = {};
    Gateways._data[carrier] = gw;
  }

  if (!gw.sms) {
    gw.updated = Date.now();
    gw.sms = sms;
  }

  if (!gw.mms) {
    gw.mms = mms;
    gw.updated = Date.now();
  }

  Gateways._save();
};

module.exports = Gateways;
