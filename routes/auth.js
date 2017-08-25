var express = require('express');

var router = express.Router();

router.get('/auth/login', (req, res) => {
  res.redirect('/#!/dashboard');
});

router.get('/auth/loginanon', (req, res) => {
  res.redirect('/#!/dashboard');
});

module.exports = router;
