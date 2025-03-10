const express = require('express');
const router = express.Router();
const {storeReturnTo} = require('../middleware');
const controller = require('../controllers/users');
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');

router.route('/register')
    .get(controller.registerForm)
    .post(wrapAsync(controller.registerUser));

router.route('/login')
    .get(controller.loginForm)
    .post(storeReturnTo, passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), controller.loginUser);

router.route('/logout')
    .get(controller.logout); 

module.exports = router;