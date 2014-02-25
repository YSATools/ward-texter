'use strict';

var request = require('request')
  , apiEndpoints
  // XXX Poor man's cache needs upgrading
  , cache = {}
  ;

apiEndpoints = [
  // need expansion
  '/api/ldsorg/me'
, '/api/ldsorg/me/household'
, '/api/ldsorg/me/ward'
, '/api/ldsorg/me/stake'
  // okay
, '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/households/:householdId'
, '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/photo-list'
, '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/member-list'
, '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/roster'
, '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/info'
, '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo'
, '/api/ldsorg/stakes/:stakeUnitNo'
];

function getCache(mid, url, fn) {
  url = url.replace(/ldsorg\/me(\b.*)/, 'ldsorg/' + mid + '$1');
  fn(null, cache[url] && cache[url].result, cache[url] && cache[url].updated);
}

module.exports.getCache = getCache;

function getUrl(mid, accessToken, url, fn) {
  var options
    ;

  options = {
    url: 'http://ldsauth.org' + url
  , headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  };

  function callback(error, response, body) {
    if (error || response.statusCode !== 200) {
      fn(error || body, null);
      return;
    }

    url = url.replace(/ldsorg\/me(\b.*)/, 'ldsorg/' + mid + '$1');
    cache[url] = {
      updated: Date.now()
    , result: JSON.parse(body)
    };
    fn(null, body);
  }

  request(options, callback);
}

module.exports.getUrl = getUrl;

function forwardOauthRequest(retrieveToken, req, res) {
  var url = req.url
    , accessToken = retrieveToken(req)
    , mid = req.user.currentUser.fkey
    ;

  getCache(mid, req.url, function (err, result, updated) {
    var now = Date.now()
      //, url = req.url
      ;

    function fin(body) {
      body = body || '{ "error": "unknown error" }';
      if (!body) {
        console.error(req.url);
      }

      if ('string' === typeof body) {
        res.end(body);
      } else {
        res.send(body);
      }
    }

    if (!result) {
      getUrl(mid, accessToken, url, function (err, data) {
        fin(err && ('error: ' + err) || data);
      });
    } else if (now - updated > (24 * 60 * 60 * 1000)) {
      getUrl(mid, accessToken, req.url, function (err, data) {
        fin(err && ('error: ' + err) || data);
      });
    } else if (now - updated > (12 * 60 * 60 * 1000)) {
      getUrl(mid, accessToken, req.url, function () {});
      fin(result);
    } else {
      fin(result);
    }
  });
}

module.exports.create = function (retrieveToken) {
  return function (rest) {
    apiEndpoints.forEach(function (url) {
      rest.get(url, forwardOauthRequest.bind(null, retrieveToken));
    });
  };
};
