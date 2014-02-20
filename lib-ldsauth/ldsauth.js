'use strict';

var request = require('request')
  ;

function forwardOauthRequest(retrieveToken, req, res) {
  var options
    , url = 'http://ldsauth.org' + req.url
    , accessToken = retrieveToken(req)
    ;

  options = {
    url: url
  , headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.end(body);
    } else {
      res.end('error: \n' + body);
    }
  }

  request(options, callback);
}

module.exports.create = function (retrieveToken) {
  return function (rest) {
    [ '/api/ldsorg/me'
    , '/api/ldsorg/me/household'
    , '/api/ldsorg/me/ward'
    , '/api/ldsorg/me/stake'
    , '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/households/:householdId'
    , '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/photo-list'
    , '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/member-list'
    , '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/roster'
    , '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo/info'
    , '/api/ldsorg/stakes/:stakeUnitNo/wards/:wardUnitNo'
    , '/api/ldsorg/stakes/:stakeUnitNo'
    ].forEach(function (url) {
      rest.get(url, forwardOauthRequest.bind(null, retrieveToken));
      /*
      var re = /(:\w+)/
        , keys = []
        , key
        , param
        ;

      while (key = re.exec(url)) {
        param = key.substr(1);
        
        keys.push(key);
      }
      */
    });
  };
};
