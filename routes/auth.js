var express = require('express');

var router = express.Router();

router.get('/login', (req, res) => {
  res.redirect('/#!/dashboard');
});

router.get('/loginanon', (req, res) => {
  res.redirect('/#!/dashboard');
});

module.exports = router;
