'use strict';

angular.module('sortinghatApp')
  .controller('MainCtrl', function ($timeout, $http, StLogin, mySession) {
    console.log(mySession);

    var $scope = this
      , messages
      , timer
      , count = 0
      , lock
      , userLock
      , wardsMap = {}
      ;

    messages = [
      "Logging you in..."
    , "Configurating the configurations..."
    , "Authenticating with the authorities..."
    , "Streaming all the things..."
    , "Watching cat videos..."
    , "Checking facebook..."
    , "Wow! More cat videos..."
    ];

    $scope.step = 0;
    $scope.wardsDownloaded = 0;

    $scope.sms = '';
    $scope.provider = 'auto';
    $scope.email = '';
    $scope.password = '';

    $scope.next = function () {
      userLock = false;
      if (lock) {
        return;
      }
      $scope.step += 1;
    };

    $scope.detectProvider = function () {
      console.log('detect provider', $scope.email, $scope.provider);
      if (($scope.email||'').match(/@(gmail|googlemail|hotmail|msn|live|outlook|yahoo|ymail).com$/i)) {
        $scope.provider = 'auto';
        return;
      }

      if ('auto' === $scope.provider) {
        $scope.provider = 'choose';
      }
    };

    function updateMessage() {
      timer = $timeout(function () {
        console.log(count, messages.length, count % messages.length, messages);
        $scope.message = messages[count % messages.length];
        count += 1;
        updateMessage();
      }, 1500);
    }

    function getMyInfo() {
      $http.get('/api/ldsorg/me').then(function (data) {
        var meta = data.data
          ;

        console.log('meta');
        console.log(meta);

        $scope.wardName = meta.currentUnits.wardName;
        $scope.stakeName = meta.currentUnits.stakeName;
        meta.currentStakes.some(function (stake) {
          if (meta.currentUnits.stakeUnitNo === stake.stakeUnitNo) {
            $scope.currentStake = meta.currentStake = stake;
            return true;
          }
        });

        $http.get('/api/ldsorg/me/household').then(function (data) {
          var household = data.data
            ;

          console.log('household');
          console.log(household);

          $scope.step += 1;

          userLock = true;
          lock = true;
          console.log('got my household');
          console.log(data);

          $scope.name = ' ' + household.headOfHousehold.name.replace(/.*, /, '');
          $scope.group = 'ward';

          $scope.stakeSize = meta.currentStake.wards.length;
          console.log('meta.currentStake.wards.length');
          console.log(meta.currentStake.wards.length);

          $http.get('/api/ldsorg/me/ward').then(function (data) {
            $timeout.cancel(timer);
            lock = false;

            var ward = data.data
              ;

            wardsMap[ward.ward.wardUnitNo] = ward;
            $scope.wardsDownloaded += 1;
            $scope.wardSize = ward.members.length;
            $scope.ward = ward;

            console.log('ward downloaded');
            console.log(ward.members.length);

            if (!userLock) {
              $scope.step += 1;
            }
          });
        });
      });
    }

    $scope.groupChange = function groupChange() {
      console.log('groupChange', $scope.group);
      if ('stake' === $scope.group) {
        $scope.getWards();
      }
    };

    $scope.getWards = function (fn) {
      var ward
        ;

      if ($scope.currentStake.index === $scope.currentStake.wards.length) {
        $scope.wards = Object.keys(wardsMap).map(function (key) {
          console.log(key, wardsMap[key].ward.wardUnitNo);
          return wardsMap[key];
        });
        console.log("stake's wards: ", $scope.wards);
        $scope.stakeMembers = 0;
        $scope.wards.forEach(function (ward) {
          $scope.stakeMembers += ward.members.length;
        });
        if (fn) { fn(); }
        return;
      }

      $scope.currentStake.index = $scope.currentStake.index || 0;
      ward = $scope.currentStake.wards[$scope.currentStake.index];

      if (wardsMap[ward.wardUnitNo] && !wardsMap[ward.wardUnitNo].inProgress) {
        $scope.currentStake.index += 1;
        $scope.wardsDownloaded = Object.keys(wardsMap).length;
        $scope.getWards(fn);
        return;
      }

      wardsMap[ward.wardUnitNo] = { inProgress: true };
      $http.get(
        '/api/ldsorg/stakes/' + $scope.currentStake.stakeUnitNo
      + '/wards/' + ward.wardUnitNo
      ).then(function (data) {
        wardsMap[ward.wardUnitNo] = data.data;
        $scope.currentStake.index += 1;
        $scope.wardsDownloaded = Object.keys(wardsMap).length;
        $scope.getWards(fn);
      });
    };

    $scope.loginScope = {};
    StLogin.makeLogin($scope.loginScope, 'lds', '/auth/ldsauth', function (session) {
      console.log('M.loginWithLds happened!');
      // TODO get the person's name via the api
      setTimeout(function () {
        $timeout.cancel(timer);
        console.log(session);
        getMyInfo();
      }, 4000);
    });

    $scope.loginWithLds = function () {
      $scope.message = 'Loading stuff...';
      updateMessage();
      if (mySession && mySession.accounts) {
        getMyInfo();
        return;
      }

      console.log('M.loginWithLds happening...');
      $scope.loginScope.loginWithLds();
    };
  });
