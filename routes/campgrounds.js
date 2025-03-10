const express = require('express');
const router = express.Router();

const wrapAsync = require('../utils/wrapAsync');
const {checkLogin, validateCampground, isCampAuthor} = require('../middleware');

const Joi = require('joi');
const controller = require('../controllers/campgrounds');

const multer = require('multer');
const {storage} = require('../cloudinary/index');
const upload = multer({storage});

router.route('/')
    .get(wrapAsync(controller.index))
    .post(checkLogin, upload.array('image'), validateCampground, wrapAsync(controller.newCamp));

router.get('/new', checkLogin, wrapAsync(controller.newCampForm));

router.get('/:id/edit', checkLogin, isCampAuthor, wrapAsync(controller.editCamp));

router.route('/:id')
    .get(wrapAsync(controller.getCamp))
    .put(checkLogin, isCampAuthor, upload.array('image'), validateCampground, wrapAsync(controller.updateCamp))
    .delete(isCampAuthor, wrapAsync(controller.deleteCamp));

module.exports = router;