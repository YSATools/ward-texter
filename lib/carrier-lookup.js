'use strict';

var telConfig = require('./tel-carrier-config')
  , telCarrier = require('tel-carrier').create(telConfig)
  ;

function formatNumber(num) {
  var re = /^1?([2-9]\d{2})(\d{3})(\d{4})$/
    ;

  num = String(num).replace(/\D/g, '');

  return re.test(num) && num.replace(re, '$1$2$3');
}

function portcheck(nums, fn) {
  var things = {}
    , newNums
    , oldMaps
    ;

  nums.forEach(function (num, i) {
    nums[i] = num = formatNumber(num) || num;
    if (num) {
      things[num] = telConfig.check(num);
    }
  });

  newNums = nums.filter(function (num) {
    return num && !things[num];
  });
  oldMaps = nums.filter(function (num) {
    return num && things[num];
  }).map(function (num) {
    return num && things[num];
  });

  console.log('newNums.length');
  console.log(newNums.length);

  if (0 === newNums.length) {
    fn(null, oldMaps);
    return;
  }

  console.log('about to lookup');
  telCarrier.lookup(newNums, function (err, maps) {
    console.log('lookup', maps.length);
    maps.forEach(function (map) {
      telConfig.handle(formatNumber(map.number) || map.number, map);
    });
    fn(err, maps.concat(oldMaps));
  }, null, telConfig.raw);
}

module.exports.lookup = portcheck;
