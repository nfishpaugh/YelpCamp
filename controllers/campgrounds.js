const Campground = require('../models/campground');
const Review = require('../models/review');
const Joi = require('joi');
const {cloudinary} = require('../cloudinary/index');
const maptilerClient = require('@maptiler/client');
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (req, res) => {
    const camps = await Campground.find({});
    res.render('campgrounds/index', { camps });
}

module.exports.newCampForm = async (req, res, next) => {
    res.render('campgrounds/new');
}

module.exports.newCamp = async (req, res, next) => {
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, {limit: 1});

    // if req.body.campground has attributes completely equal to
    // (===) any attributes in Campground, it will autofill them
    // with the values from req.body.campground
    //if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const c = new Campground(req.body.campground);
    console.log(geoData.features[0].geometry);
    c.geometry = geoData.features[0].geometry;
    c.author = req.user._id;

    // implicit return (only allowed in arrow functions) of an
    // object of the url and filename of every file that is
    // stored in req.files
    c.images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    await c.save();
    req.flash('success', 'Successfully made new campground');
    res.redirect(`/campgrounds/${c._id}`);
}

module.exports.editCamp = async (req, res, next) => {
    const camp = await Campground.findById(req.params.id);
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { camp });
}

module.exports.getCamp = async (req, res, next) => {
    const { id } = req.params;
    // nested populate, needed since reviews also have authors
    // that need to be populated. path is the attribute that is
    // assigned by default when no other attributes are specified,
    // e.g. .populate('author') = path: 'author'
    const c = await Campground.findById(id).populate(
        {
            path: 'reviews',
            populate: {
                path: 'author'
            }
        }).populate('author');
    if (!c) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { c });
}

module.exports.updateCamp = async (req, res, next) => {
    const camp = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground }, { new: true });

    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, {limit: 1});
    camp.geometry = geoData.features[0].geometry;

    // implicit return (only allowed in arrow functions) of an
    // object of the url and filename of every file that is
    // stored in req.files
    const imgArr = req.files.map(f => ({ url: f.path, filename: f.filename }))
    camp.images.push(...imgArr);
    await camp.save();

    // deletes any images selected from Mongo and Cloudinary
    // DO NOT DELETE SEED IMAGES!
    console.log(`Images to delete: ${req.body.deleteImages}`);
    if (req.body.deleteImages) {
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        console.log(camp);
    }
    res.redirect(`/campgrounds/${camp._id}`);
}

module.exports.deleteCamp = async (req, res, next) => {
    try {
        const c = await Campground.findById(req.params.id);

        // creates a new array with ids from the reviews
        // that have a relationship with the campground
        const revIds = c.reviews.map((rev) => rev._id);

        const revwait = await Review.deleteMany({ _id: { $in: revIds } });
        const cwait = await Campground.deleteOne({ _id: req.params.id });

        if (revwait) console.log(`Reviews deleted: ${revwait.deletedCount}`);
        if (cwait) console.log(`Campgrounds deleted: ${cwait.deletedCount}`);

        req.flash('success', 'Deleted campground');
        res.redirect('/campgrounds');
    } catch (e) {
        req.flash('error', `Campground deletion error: ${e}`);
        res.redirect('/campgrounds');
    }
}