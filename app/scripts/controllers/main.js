'use strict';

angular.module('sortinghatApp')
  .controller('MainCtrl', function ($rootScope, $timeout, $http, Stripe, StLogin, StSession, mySession) {
    console.log(mySession);

    var $scope = this
      , lock
      , userLock
      , wardsMap = {}
      , Progress = {}
      ;

    Progress.messages = [
      "Waiting the wait"
    , "Breaking bad"
    , "Taking a number"
    , "Taking a long time"
    , "Bathroom break"
    , "Taking a coffee break (is that okay?)"
    , "Filling out paperwork"
    , "Using a black or blue ball point pen"
    , "Watching the pot boil"
    , "Keeping promises"
    , "Configurating the configurations"
    , "Authenticating with the authorities"
    , "Duct taping the ducks"
    , "Cleaning all the things"
    , "Watching cat videos"
    , "Streaming digital content"
    , "Checking facebook"
    , "Waiting for the hot water to turn on"
    , "Checking out Beiber's twitter feed"
    , "Wow! More cat videos"
    , "Setting phasers to stun"
    , "Plunging the pipework"
    , "Rescuing the princess"
    , "Making the horizons vertical"
    , "Loading"
      // Matrix
    , "Going down the rabbit hole"
    , "Taking the red pill"
      // Finding Nemo
    , "Finding nemo"
      // Zoolander
    , "Being ridiculously good-looking"
    , "Remembering thinking \"wow, you're ridiculously good looking\""
    , "Building a building at least... three times bigger than this"
      // Harry Potter
    , "Destroying Horcruxes"
      // Gravity
    , "Making it down there in one piece"
      // Psych
    , "Fist bumping"
    , "Having great hair"
      // Chuck
    , "Flashing on the intersect"
      // Doctor Who
    , "Running"
    , "Allons-y-ing"
      // Emperor's new Groove
    , "Throwing off the groove"
    , "Pulling the lever"
    , "Leading you down the path of righteousness"
    , "Leading you down the path that rocks"
    , "And I'm one of those two, right?"
      // Princess Bride
    , "Finding true love" // ??
    , "Building up an immunity to iocane powder"
    , "Blaving"
      // BTTF
    , "Going back to the future"
    , "Getting to 88 miles per hour"
    , "Generating 1.21 gigawatts"
      // Toy Story
    , "Riding like the wind"
      // Mary Poppins
    , "Tidying up the nursery"
      // OUYA!
      // https://devs.ouya.tv/update_strings.txt
    , "Preparing to televise the Revolution"
    , "Downloading awesome sauce"
    , "Maximizing fun level"
    , "Shifting bits"
    , "Tasting rainbows"
    , "Herding cats"
    , "Aligning synergies"
    , "Shooting stars"
    , "Well, I never!"
    , "Bending genres"
    , "Stretching analogies"
    , "Calculating odds"
    , "Peeling away layers"
    , "Reducing complexity"
    , "Opening flaps"
    , "Inventing emoticons"
    , "Sharpening skates"
    , "Keeping calm"
    , "Refactoring bezier curves"
    , "We Must Perform A Quirkafleeg"
    //, "To be honest, just downloading a firmware update"
    , "To be honest, just downloading data"
    , "Rearranging deckchairs"
    , "Arming Photon Torpedoes"
    , "Adding the fun"
      // STAR WARS
      // http://www.rebellegion.com/forum/viewtopic.php?t=44301&start=0&sid=7de4a81df6ce49432b1d35dd7f15b650
    , "Staying on target"
    , "Looking at the size of that thing"
    , "Watching for enemy fighters"
    , "Staying in formation"
    , "Blowing this thing so we can go home"
    , "Making the jump to lightspeed"
    , "Destroying the Death Star"
    , "Locking S-foils in attack position"
    , "Accelerating to attack speed"
    ].sort(function () { return 0.5 - Math.random(); });

    Progress.start = function () {
      console.log('starting progress');
      var me = this
        ;

      if (this._started) {
        console.log("already started");
        return;
      }

      function updateProgress() {
        $scope.progress += 0.5;
        if ($scope.progress >= 105) {
          $scope.progress = 70;
        }
        me._timer2 = $timeout(updateProgress, 500);
      }

      function update() {
        function innerUpdate() {
          $scope.message = Progress.messages[me._count % Progress.messages.length] + '...';
          me._count += 1;
          me._timer = $timeout(innerUpdate, 2000);
        }
        innerUpdate();
      }

      me._count = me._count || 0;
      update();
      updateProgress();

      this._started = true;
    };
    Progress.stop = function () {
      console.log('stopping progress');
      this._started = false;
      $scope.message = '';
      $timeout.cancel(this._timer);
      $timeout.cancel(this._timer2);
    };

    $scope.step = 0;
    $scope.wardsDownloaded = 0;

    $scope.sms = '';
    $scope.provider = 'auto';
    $scope.email = '';
    $scope.password = '';

    // Yes, I know this is a terribly wrong way to go through states.
    $scope.next = function () {
      if (2 === $scope.step) {
        console.log('step 2 wardsMap', wardsMap);
        $scope.households = [];
        $scope.householdsMap = {};
        $scope.members = [];
        $scope.membersMap = {};
        Object.keys(wardsMap).forEach(function (key) {
          var ward = wardsMap[key]
            ;

          $scope.households = $scope.households.concat(ward.households);
          $scope.members = $scope.members.concat(ward.members);
        });

        $scope.households.forEach(function (h) {
          $scope.householdsMap[h.headOfHousehold.individualId] = h;
          h.headOfHousehold.phone = (h.headOfHousehold.phone||'')
            .replace(/\D/g, '')
            .replace(/1?([2-9]\d{2})(\d{3})(\d{4})$/, '($1) $2-$3')
            ;
          h.householdInfo.phone = (h.householdInfo.phone||'')
            .replace(/\D/g, '')
            .replace(/1?([2-9]\d{2})(\d{3})(\d{4})$/, '($1) $2-$3')
            ;
          if (14 !== String(h.headOfHousehold.phone).length) {
            delete h.headOfHousehold.phone;
          }
          if (14 !== String(h.householdInfo.phone).length) {
            delete h.householdInfo.phone;
          }
          if (h.headOfHousehold.phone === h.householdInfo.phone) {
            delete h.householdInfo.phone;
          }

          if (h.headOfHousehold.email === h.householdInfo.email) {
            delete h.householdInfo.email;
          }

          if (h.headOfHousehold.imageData === h.householdInfo.imageData) {
            delete h.householdInfo.imageData;
          }
          if (h.headOfHousehold.phone || h.householdInfo.phone || h.headOfHousehold.email || h.householdInfo.email) {
            h.include = true;
          }
        });
        $scope.members.forEach(function (m) {
          $scope.householdsMap[m.headOfHouse.individualId].gender = m.headOfHouse.gender;
        });
        $scope.selectAll = function () {
          $scope.households.forEach(function (h) {
            h.include = true;
          });
        };
        $scope.selectNone = function () {
          $scope.households.forEach(function (h) {
            h.include = false;
          });
        };



        $scope.households.sort(function (a, b) {
          if (a.gender > b.gender) {
            return 1;
          } else if (a.gender < b.gender) {
            return -1;
          } else {
            return 0;
          }
        });
      }

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

    function getMyInfo(err, session) {
      $scope.alertMsg = '';
      Progress.start();
      $http.get('/api/ldsorg/me').then(function (data) {
        var meta = data.data
          , household = meta.currentHousehold
          ;

        $scope.meta = meta;
        if (/error/.test(JSON.stringify(data))) {
          $scope.alertMsg = "Oopsies. There was a connection error. Refresh and try again. :-)";
          return;
        }
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

        console.log('household');
        console.log(household);

        userLock = true;
        lock = true;
        console.log('got my household');
        console.log(data);

        $scope.name = ' ' + household.headOfHousehold.name.replace(/.*, /, '');
        $scope.group = 'ward';

        $scope.stakeSize = meta.currentStake.wards.length;
        console.log('meta.currentStake.wards.length');
        console.log(meta.currentStake.wards.length);

        $scope.step += 1;

        getMyAreaInfo(session, meta);
      });
    }

    function getMyAreaInfo(session, meta) {
      var url = '/api/ldsorg/stakes/' + meta.currentUnits.stakeUnitNo + '/wards/' + meta.currentUnits.wardUnitNo
        ;

      $http.get(url).then(function (data) {
        console.log('stop c');
        Progress.stop();
        lock = false;

        var ward = data.data
          ;

        wardsMap[ward.ward.wardUnitNo] = ward;
        $scope.wardsDownloaded += 1;
        $scope.wardSize = ward.members.length;
        $scope.ward = ward;

        console.log('ward downloaded', ward);
        console.log(ward.members.length);

        if (!userLock) {
          $scope.step += 1;
        }
      });
    }

    $scope.groupChange = function groupChange() {
      if ('stake' === $scope.group) {
        Progress.start();
        $scope.getWards();
      }
    };

    $scope.getWards = function (fn) {
      var ward
        ;

      Progress.start();

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
        console.log('stop a');
        Progress.stop();
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

    $scope.debounceCount = 0;
    $scope.debounceSearchText = function () {
      $scope.debounceCount += 1;
      if (0 !== $scope.debounceCount % 4) {
        $timeout.cancel($scope.debounceToken);
      }
      $scope.debounceToken = $timeout(function () {
        $scope.searchTextDebounced = $scope.searchText;
      }, 250);
    };

    $scope.loginScope = {};
    StLogin.makeLogin($scope.loginScope, 'lds', '/auth/ldsconnect', function (err, session) {
      $timeout.cancel($scope.loginTimeout);
      console.log('M.loginWithLds happened!');
      if (err) {
        console.error(err);
        if (/Access Denied/.test(err)) {
          // prevent bug caused by alert where $scope.message doesn't update
          $timeout(function () {
            window.alert("You denied us? Ouch... well, see ya later... (or try again if it was an accident)");
          });
        } else {
          window.alert("Login failed. Sorry about that. You probably used the wrong username / password");
        }
        Progress.stop();
        return;
      }
      StSession.update(session);
      console.log(session);
      getMyInfo(null, session);
    });

    function processSelected() {
      var whom = {}
        , count = 0
        ;

      function setWhom(areaId, stakeId, wardId, memberId) {
        var area  = whom[areaId] = whom[areaId] || {}
          , stake = area[stakeId] = area[stakeId] || {}
          , ward = stake[wardId] = stake[wardId] || []
          ;

        // XXX in the future we may want to specify which number or email address? Or add the carrier?
        ward.push(memberId);
      }

      $scope.households.forEach(function (m) {
        var w = m.ward
          ;

        if (m.include) {
          if (m.headOfHousehold.phone || m.householdInfo.phone) {
            count += 1;
          }
          if (m.headOfHousehold.phone && m.householdInfo.phone
            && (m.headOfHousehold.phone !==  m.householdInfo.phone)) {
            count += 1;
          }
          setWhom(w.areaUnitNo, w.stakeUnitNo, w.wardUnitNo, m.headOfHousehold.individualId);
        }
      });

      return { count: count, whom: whom };
    }

    $scope.send = function () {
      var service
        , whom
        ;

      if (!/Provo/.test($scope.wardName) || !/YSA/.test) {
        window.alert("Currently this tool is only available to Provo YSA. It will be available to other YSA wards in the near future. If you are in a family ward and would like to use this tool, we'll get to that to eventually, but there are some privacy issues concerning children < 18 that have to be dealt with first.");
        return;
      }

      whom = processSelected().whom;

      if ('choose' === $scope.provider) {
        window.alert("Choose an email provider. If your provider isn't listed create a gmail account - or pay me a hundred bucks or so and I'll figure out how to make it work.");
        return;
      } else if ('auto' !== $scope.provider) {
        service = $scope.provider;
      }

      $http.post(
        '/api/message'
      , { sms: $scope.sms
        , whom: whom
        , email: $scope.email
        , password: $scope.password
        , service: service
        }
      ).then(function (res) {
        console.log(Object.keys(res));
        console.log('res.headers');
        console.log(res.headers);
        console.log('res.data');
        console.log(res.data);
        if (!res.data || !res.data.success) {
          window.alert('[NOT IMPLEMENTED] There was an error sending the message.');
        } else {
          $scope.next();
        }
      }, function (data) {
        console.error(data);
        window.alert('There was an error sending the message. Check your WiFi connection and try again.');
      });

    };

    $scope.loginWithLds = function () {
      $scope.progress = 0;
      $scope.message = 'Logging you in...';
      Progress.start();

      if (mySession && mySession.accounts) {
        getMyInfo(null, mySession);
        return;
      }

      console.log('M.loginWithLds happening...');
      $scope.loginScope.loginWithLds();

      $scope.loginTimeout = $timeout(function () {
        $scope.alertMsg = "Hmm... this is taking much longer than expected. "
          + "Perhaps it would be best to refresh the page and try again.";
      }, 45 * 1000);
    };

    /*
      card: Object
      created: 1394136518
      email: "coolaj86@gmail.com"
      id: "tok_103cMW2r5QTT3HO4msvPzpEO"
      livemode: false
      object: "token"
      type: "card"
      used: false
    */
    // check for payment beforehand
    $scope.payWithStripe = function () {
      var count = processSelected().count
        ;

      Stripe.subscribe(
        { name: 'TextYourWard.org'
        , group: $scope.group
        , displayAmount: count * 2
        , plan: $scope.plan // TODO
        , email: $scope.meta.currentHousehold.headOfHousehold.email
            || $scope.meta.currentHousehold.householdInfo.email
        , description: 'Text ' + count + ' Ward Members ($' + ((count/50).toFixed(2)) + ')'
        }
      , function (resp) {
          if (resp.data.success) {
            $scope.unitHasPaid = true;
          }
        }
      );
    };
  });
