var express = require('express');

var router = express.Router();

router.get('/auth/login', (req, res) => {
  req.session.logged = true;
  req.session.anonymous = false;
  res.redirect('/#!/dashboard');
});

router.get('/auth/loginanon', (req, res) => {
  req.session.logged = true;
  req.session.anonymous = true;
  res.redirect('/#!/dashboard');
});

router.get('/auth/logged', (req, res) => {
  res.send({
    logged: req.session.logged || false,
    anonymous: req.session.anonymous
  });
});

router.get('/auth/logout', (req, res) => {
  req.session.logged = false;
  delete req.session.anonymous;
  res.redirect('/');
});

module.exports = router;
