'use strict';

angular.module('sortinghatApp')
  .service('Stripe', function Stripe($http) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var handler
      , cb
      , options
      ;

    handler = window.StripeCheckout.configure({
      key: 'pk_test_526DRmZwEOiMxTigV5fX52ti',
      image: '/images/logo-128.png',
      token: function(token, args) {
        var opts = options
          , fn = cb
          ;

        options = null;
        cb = null;

        // Warning, anything done here is out-of-angular scope
        console.log("Stripe Payment");
        console.log(token, args, opts);
        // Use the token to create the charge with a server-side script.
        // You can access the token ID with `token.id`
        if (!fn) {
          console.error("No callback function to stripe!? Something is seriously wrong here!");
        }

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

        $http.post('/api/payments/', {
          stripeToken: token
        , paymentOptions: opts
        }).then(function (resp) {
          // back-in-angular scope
          console.log('[payment complete]');
          console.log(resp.data);
          fn(resp, token, args, opts);
        });
      }
    });

    function handle() {
      // Open Checkout with further options
      handler.open({
        name: options.name
      , description: options.description
      , amount: options.displayAmount
      , email: options.email
      });
    }

    function subscribe(_options, _cb) {
      options = _options;
      cb = _cb;

      handle(options);

      if (options.amount) {
        console.error("You called stripe subscribe, but you specified 'amount'. Did you mean 'displayAmount'?");
      }
      if (!options.plan) {
        console.error("You called stripe subscribe, but you didn't specify a plan");
      }
    }

    function pay(_options, _cb) {
      options = _options;
      cb = _cb;

      handle(options);

      if (!options.amount) {
        console.error("You called stripe pay, but you didn't specify an amount");
      }
    }

    return {
      subscribe: subscribe
    , pay: pay
    };
  });
