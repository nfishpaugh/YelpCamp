const express = require('express');
const router = express.Router({mergeParams: true});

const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');

const controller = require('../controllers/reviews');
const Joi = require('joi');
const {validateReview, checkLogin, isReviewAuthor} = require('../middleware');

router.route('/')
    .get(controller.campgroundRedirect)
    .post(checkLogin, validateReview, wrapAsync(controller.createReview));

router.delete('/:reviewid', checkLogin, isReviewAuthor, wrapAsync(controller.deleteReview));

module.exports = router;