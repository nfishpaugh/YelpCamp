const Campground = require('./models/campground');
const Review = require('./models/review');
const ExpressError = require('./utils/ExpressError');
const Joi = require('joi');
const { campgroundSchema, reviewSchema } = require('./schemas');

module.exports.validateReview = (req, res, next) => {
    const result = reviewSchema.validate(req.body);
    const {error} = result;
    if(error){
        //const msg = error.details.map(el => el.msg).join(',');
        throw new ExpressError(error.message, 400);
    } else {
        next();
    }
}

module.exports.checkLogin = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.storeReturnTo = (req, res, next) => {
    console.log(`Return to: ${req.session.returnTo}`);
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    const result = campgroundSchema.validate(req.body);
    const {error} = result;
    if(error){
        // concatenates multiple error messages into one string
        //const msg = error.details.map(el => el.msg).join(',');
        throw new ExpressError(error.message, 400);
    } else {
        next();
    }
}

module.exports.isCampAuthor = async (req, res, next) => {
    const camp = await Campground.findById(req.params.id);
    if(!camp){
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds/')
    }
    if(!camp.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to do that.');
        return res.redirect(`/campgrounds/${req.params.id}`)
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const rev = await Review.findById(req.params.reviewid);
    if(!rev){
        req.flash('error', 'Cannot find that review');
        return res.redirect('/campgrounds/')
    }
    if(!rev.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to do that.');
        return res.redirect(`/campgrounds/${req.params.id}`)
    }
    next();
}

