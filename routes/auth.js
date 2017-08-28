var express = require('express');

var router = express.Router();
const app = express();

// router.get('/auth/login', (req, res) => {
//   req.session.logged = true;
//   req.session.anonymous = false;
//   res.redirect('/#!/dashboard');
// });

// router.get('/auth/loginanon', (req, res) => {
//   req.session.logged = true;
//   req.session.anonymous = true;
//   res.redirect('/#!/dashboard');
// });

router.get('/auth/logged', (req, res) => {
  res.send({
    logged: req.isAuthenticated(),
    anonymous: req.session.anonymous
    // ToDo - send to client user info.
  });
});

// router.get('/auth/logout', (req, res) => {
//   req.session.logged = false;
//   delete req.session.anonymous;
//   res.redirect('/');
// });

module.exports = router;
