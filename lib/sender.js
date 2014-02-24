'use strict';

var lookup = require('./carrier-lookup').lookup
  ;

function handle(data) {
  var numbers = Object.keys(data.report.numbers)
    ;

  lookup(numbers, function (err, nums) {
    console.log(nums);
  });
}

module.exports.handle = handle;

function run() {
  handle(require('./test-message.json'));
}

if (require.main === module) {
  run();
}
