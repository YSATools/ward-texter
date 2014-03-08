'use strict';

exports.init = function (config) {
  var stripe
    ;

  stripe = require("stripe")(config.secret);

  /*
  stripe.plans.create({
    amount: 2000,
    interval: "month",
    name: "Amazing Gold Plan",
    currency: "usd",
    id: "gold"
  // free trial
  }, function(err, plan) {
    // asynchronously called
  });
  */

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here https://manage.stripe.com/account
  stripe.setApiKey(config.secret);

  // (Assuming you're using express - expressjs.com)
  // Get the credit card details submitted by the form
  function subscribe(req, res) {
    var payment = req.body
      , stripeToken = payment.stripeToken
      , options = payment.paymentOptions
      , amount
      ;

    if (!stripeToken || !stripeToken.id || !options || !(options.plan || options.count)) {
      res.send({ error: "Invalid Token or Options (textyourward)" });
      return;
    }

    if (!options.plan) {
      amount = options.count;
    }

    function subscribeCustomer() {
      stripe.customers.create(
        { card: stripeToken.id
        , plan: options.plan
        , email: stripeToken.email
        }
      , function(err, customer) {
          if (err) {
            console.error('[STRIPE Error]');
            console.error(err);
            res.send(err);
            return;
          }

          res.send(req.user);
          console.log(req.user);
          console.log(customer);
          console.log(req.user.currentUser);
          //customers.save(customer, card.plan, card.email);
        }
      );
    }
/*
{ id: 'ch_103cRE2r5QTT3HO4sCiNSQXb',
  object: 'charge',
  created: 1394154043,
  livemode: false,
  paid: true,
  amount: 221,
  currency: 'usd',
  refunded: false,
  card:
   { id: 'card_103cRE2r5QTT3HO4EKWsUSQZ',
     object: 'card',
     last4: '4242',
     type: 'Visa',
     exp_month: 1,
     exp_year: 2018,
     fingerprint: '8KD3JPLFk9j58bbG',
     customer: null,
     country: 'US',
     name: 'Dumbledore.Albus@example.com',
     address_line1: null,
     address_line2: null,
     address_city: null,
     address_state: null,
     address_zip: null,
     address_country: null,
     cvc_check: 'pass',
     address_line1_check: null,
     address_zip_check: null },
  captured: true,
  refunds: [],
  balance_transaction: 'txn_103cRE2r5QTT3HO4ocTaw86s',
  failure_message: null,
  failure_code: null,
  amount_refunded: 0,
  customer: null,
  invoice: null,
  description: 'Dumbledore.Albus@example.com',
  dispute: null,
  metadata: {} }
*/
    function chargeCustomer() {
      stripe.charges.create({
        // amount in cents, again
        amount: amount
      , currency: "usd"
      , card: stripeToken.id
      , description: stripeToken.email
      }, function(err, charge) {
        if (err && err.type === 'StripeCardError') {
          // The card has been declined
        }
        console.log(charge);
        if (err) {
          console.error('[STRIPE Error]');
          console.error(err);
          res.send(err);
          return;
        }

        res.send(req.user);
        console.log(req.user);
        console.log(charge);
        console.log(req.user.currentUser);
        //customers.save(customer, card.plan, card.email);

      });
    }

    if (options.plan) {
      subscribeCustomer();
    } else {
      chargeCustomer();
    }
  }

  function route(rest) {
    rest.post('/api/payments', subscribe);
  }

  return  {
    subscribe: subscribe
  , route: route
  };
};
