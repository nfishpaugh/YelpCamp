const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res, next) => {
    if(req.body.review.rating == 0){
        req.flash("error", "Rating cannot be 0 stars!");
        return res.redirect(`/campgrounds/${req.params.id}`);
    }
    const c = await Campground.findById(req.params.id);
    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    c.reviews.push(newReview);
    await newReview.save();
    await c.save();
    req.flash('success', 'Created new review');
    res.redirect(`/campgrounds/${c._id}`);
}

// redirects to the campground URL if the user tries to
// access a (currently) non-existent collated review page
module.exports.campgroundRedirect = (req, res, next) => {
    const reviewUrl = req.originalUrl;
    const newUrl = reviewUrl.slice(0, reviewUrl.indexOf("/reviews"));
    res.redirect(newUrl);
}

module.exports.deleteReview = async (req, res, next) => {
    const {id, reviewid} = req.params;

    // $pull is a mongo operator that removes from an existing array all instances of a
    // value or values that match a specified condition
    const c = await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewid}});
    const review = await Review.findByIdAndDelete(reviewid);
    req.flash('success', 'Deleted review');
    res.redirect(`/campgrounds/${id}`);
}