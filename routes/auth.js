const express = require('express');
const passport = require('passport');
const WebAppStrategy = require('bluemix-appid').WebAppStrategy;

// libraries for App-ID
const helmet = require('helmet');
const flash = require('connect-flash');

var router = express.Router();

// Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}.
// If forceLogin is set to false redirect to login widget will not occur for already authenticated users.
router.get('/auth/login', passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
  successRedirect: '/#!/dashboard',
  forceLogin: true
}));

// Explicit anonymous login endpoint.
// Will always redirect browser for anonymous login due to forceLogin: true
router.get('/auth/loginanon', passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
  successRedirect: '/#!/dashboard',
  allowAnonymousLogin: true,
  allowCreateNewAnonymousUser: true
}));

// Callback to finish the authorization process. Will retrieve access and identity tokens/
// from App ID service and redirect to either (in below order)
// 1. the original URL of the request that triggered authentication, as persisted in HTTP session under WebAppStrategy.ORIGINAL_URL key.
// 2. successRedirect as specified in passport.authenticate(name, {successRedirect: "...."}) invocation
// 3. application root ("/")
router.get('/auth/callback', passport.authenticate(WebAppStrategy.STRATEGY_NAME));

router.get('/auth/logged', (req, res) => {
  res.send({
    logged: req.isAuthenticated(),
    profile: req.user
  });
});

// Logout endpoint. Clears authentication information from session
router.get('/auth/logout', (req, res) => {
  WebAppStrategy.logout(req);
  res.redirect('/');
});

module.exports = (app, appIDCredentials) => {
  // Configure passportjs with user serialization/deserialization. This is required
  // for authenticated session persistence accross HTTP requests. See passportjs docs
  // for additional information http://passportjs.org/docs
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((obj, cb) => {
    cb(null, obj);
  });

  // Configure express application to use passportjs
  app.use(passport.initialize());
  app.use(passport.session());

  //  Used for AppID - Helmet helps to secure Express apps by setting various HTTP headers
  app.use(helmet());
  app.use(flash());

  // Configure passportjs to use AppID WebAppStrategy
  passport.use(new WebAppStrategy(appIDCredentials));

  return router;
};
