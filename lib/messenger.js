'use strict';

var fs = require('fs')
  , getCache = require('../lib-ldsauth/ldsauth').getCache
  , forEachAsync = require('foreachasync').forEachAsync
  //, getSmsGateway = require('./get-gateways').getSmsGateway
  ;

function formatNumber(num) {
  var re = /^1?([2-9]\d{2})(\d{3})(\d{4})$/
    ;

  num = String(num).replace(/\D/g, '');

  return re.test(num) && num.replace(re, '1$1$2$3');
}
function mergeWard(ward) {
  var members = ward.members
    , membersMap = {}
    , households = ward.households
    , householdsMap = {}
    ;

  members.forEach(function (m) {
    membersMap[m.headOfHouse.individualId] = m;
  });
  households.forEach(function (h) {
    var emailRe = /^([\w\.\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@[0-9a-z\-\.]+\.[0-9a-z\-\.]+)$/ig
      ;

    h.headOfHousehold.phone = formatNumber(h.headOfHousehold.phone);
    h.householdInfo.phone = formatNumber(h.householdInfo.phone);

    h.headOfHousehold.email = String(h.headOfHousehold.email).trim().toLowerCase();
    if (!emailRe.test(h.headOfHousehold.email)) {
      delete h.headOfHousehold.email;
    }
    h.householdInfo.email = String(h.householdInfo.email).trim().toLowerCase();
    if (!emailRe.test(h.householdInfo.email)) {
      delete h.householdInfo.email;
    }

    householdsMap[h.headOfHousehold.individualId] = h;
  });

  return householdsMap;
}

function getPhoneEmailList(allPowerful, areas, units, fn) {
  var numbersMap = {}
    , emailsMap = {}
    , phoneable = {}
    , emailable = {}
    , unreachable = {}
    , stakeId
    ;

  // assuming 1 area, 1 stake, but many wards for now
  forEachAsync(Object.keys(areas), function (next, areaId) {
    var stakes = areas[areaId]
      ;

    if (!stakes || (!allPowerful && String(areaId) !== String(units.areaUnitNo))) {
      next();
      return;
    }

    forEachAsync(Object.keys(stakes), function (next, _stakeId) {
      stakeId = _stakeId;
      var wards = stakes[stakeId]
        ;

      if (!wards || (!allPowerful && String(stakeId) !== String(units.stakeUnitNo))) {
        next();
        return;
      }

      forEachAsync(Object.keys(wards), function (next, wardId) {
        var members = wards[wardId]
          ;

        //getCache(req.user.accessToken, '/');
        // id isn't needed for stake lookup
        getCache(null, '/api/ldsorg/stakes/' + stakeId + '/wards/' + wardId, function (err, result) {
          if (err) {
            console.log(err);
          }
          var map = mergeWard(result)
            ;

          members.forEach(function (mid) {
            var h = map[mid]
              ;

            // XXX ignoring rare case of sharing phones for now
            if (h.householdInfo.phone) {
              numbersMap[h.householdInfo.phone] = mid;
              phoneable[mid] = true;
            }
            if (h.headOfHousehold.phone) {
              numbersMap[h.headOfHousehold.phone] = mid;
              phoneable[mid] = true;
            }
            if (h.householdInfo.email) {
              emailsMap[h.householdInfo.email] = mid;
              emailable[mid] = true;
            }
            if (h.headOfHousehold.email) {
              emailsMap[h.headOfHousehold.email] = mid;
              emailable[mid] = true;
            }

            if (!phoneable[mid] && emailable[mid]) {
              unreachable[mid] = true;
            }
          });

          next();
        });
      }).then(function () {
        next();
      });
    }).then(function () {
      next();
    });
  }).then(function () {
    // TODO report failed numbers
    fn(null, {
      phoneable: Object.keys(phoneable)
    , emailable: Object.keys(emailable)
    , unreachable: Object.keys(unreachable)
    , numbers: numbersMap
    , emails: emailsMap
    , stakeId: stakeId
    });
  });
}

module.exports.route = function route(app) {
  app.post('/api/message', function (req, res) {
    // This is me, AJ. I take full power so that I can debug and stuff
    var allPowerful = ('3600476369' === String(req.user.currentUser.fkey))
      , directive = req.body || {}
      ;

    getCache(req.user.currentUser.fkey, '/api/ldsorg/me', function (err, user) {
      var units = user.currentUnits
        , areas = directive.whom
        ;

      if (!areas) {
        res.send({ "error": "no 'to whom'" });
      }

      getPhoneEmailList(allPowerful, areas, units, function (err, report) {
        // TODO send email with report
        fs.writeFileSync(__dirname + '/'+ Date.now() + '-' + report.stakeId + '.json', JSON.stringify({
          report: report
        , sms: req.body.sms
        , email: req.body.email
        , password: req.body.password
        , service: req.body.service
        }));
        report.success = true;
        res.send(err && { error: err } || report);
      });
    });
  });
};
