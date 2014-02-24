'use strict';

var lookup = require('./carrier-lookup').lookup
  , nodemailer = require('nodemailer')
  ;

function mail(addresses, params, fn) {
  var transport
    , headers = {}
    , opts = {}
    , max = 160
    , tail = ' via ysawards.org'
    , bodyMax = max - tail.length
    ;

  headers.subject = params.subject || '';
  headers.text = params.sms.substr(0, bodyMax) + tail;
  headers.bcc = addresses.join(',');
  headers.cc = params.from || params.email;
  headers.from = params.from || params.email;
  headers.replyTo = params.replyTo || params.from || params.email;
  //headers.headers = {};

  opts = {
    auth: {
      user: params.email
    , pass: params.password
    }
  };

  if (!params.service) {
    params.service = 'SMTP';
  }

  transport = nodemailer.createTransport(params.service, opts);

  // TODO send a report of hit / miss
  transport.sendMail(headers, function (err) {
    transport.close();

    if (!err) {
      fn(null, { success: true });
      return;
    }

    console.log('\n[params]');
    console.log(params);
    console.log('\n[headers]');
    console.log(headers);
    console.log('\n[opts]');
    console.log(opts);

    console.error(err.toString());
    console.error(err);

    fn(err);
  });
}

function handle(data, fn) {
  var numbers = Object.keys(data.report.numbers)
    , emails = Object.keys(data.report.emails)
    ;

  lookup(numbers, function (err, nums) {
    var gateways
      ;

    gateways = nums.filter(function (n) {
      return n.smsGateway;
    }).map(function (n) {
      return n.smsGateway;
    });

    mail(gateways, data, function (err) {
      if (err) {
        fn(err);
        return;
      }
      data.subject = '. ';
      mail(emails, data, fn);
    });
  });
}

module.exports.send = handle;

function run() {
  handle(require('./test-message.json'), function (err, data) {
    if (err) {
      console.error('error');
      console.error(err);
      return;
    }

    console.log(data);
  });
}

if (require.main === module) {
  run();
}
