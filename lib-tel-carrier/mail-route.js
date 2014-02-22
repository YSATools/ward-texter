'use strict';

var nodemailer = require('nodemailer')
  , forEachAsync = require('foreachasync').forEachAsync
  , TelCarrier = require('tel-carrier')
  , telCarrierCache
  , telCarrierLookup
  ;

telCarrierCache = TelCarrier.create({ service: 'tel-carrier-cache' });
//telCarrierLookup = TelCarrier.create({ service: 'carrierlookup.com' });

function normalizeNumber(number) {
  var valNum = /(?=\+?1)?(\d{10})$/.exec(String(number))
    ;

  return valNum && ('+1' + valNum[1]);
}

function getGatewayAddresses(numbers, cb, telCarrier) {
  var result = []
    ;

  forEachAsync(numbers, function (next, number) {
    // sometimes '+' becomes ' ' or '%20'
    var valNum = normalizeNumber(number)
      ;

    if (!valNum) {
      next();
      return;
    }

    number = valNum;
    telCarrier.lookup(number, function (err, info) {
      if (info) {
        result.push(info);
      }
      next();
    });
  }).then(function () {
    cb(result);
  });
}

function route(app) {
  app.post('/sms', function (req, res) {
    if (!req.body.service) {
      req.body.service = 'SMTP';
    }
    if (
        !Array.isArray(req.body.numbers)
      || 'string' !== typeof req.body.sms
      || 'string' !== typeof req.body.email || /[,\s]/.test(req.body.email)
      || 'string' !== typeof req.body.password
      || 'string' !== typeof req.body.service
    ) {
      res.send({ error: "All of 'numbers', 'body', 'email', and 'password' must be present."});
      return;
    }

    function gotGatewayAddresses(addresses) {
      var transport
        , headers = {}
        , opts = {}
        , max = 160
        , tail = ' via ysawards.org'
        , bodyMax = max - tail.length
        ;

      headers.subject = '';
      headers.text = req.body.sms.substr(0, bodyMax) + tail;
      headers.bcc = addresses.join(',');
      headers.cc = req.body.email;
      headers.from = req.body.email;
      headers.replyTo = req.body.email;

      opts = {
        auth: {
          user: req.body.email
        , pass: req.body.password
        }
      };

      transport = nodemailer.createTransport(req.body.service, opts);

      // TODO send a report of hit / miss
      transport.sendMail(headers, function (err) {
        transport.close();

        if (!err) {
          res.send({ success: true });
          return;
        }

        console.log('\n[req.body]');
        console.log(req.body);
        console.log('\n[headers]');
        console.log(headers);
        console.log('\n[opts]');
        console.log(opts);

        console.error(err.toString());
        console.error(err);

        res.send(err);
      });
    }

    getGatewayAddresses(
      req.body.numbers
    , gotGatewayAddresses
    , ('pizza' === req.body.secret ? telCarrierLookup : telCarrierCache)
    );
  });
}

module.exports.route = route;
