// if we are not in development mode, do not require this module.
// dotenv loads environment variables from a .env file so you can use
// them in code, and in production we would not want to use this
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');  
const campRouter = require('./routes/campgrounds');
const reviewRouter = require('./routes/reviews');
const userRouter = require('./routes/users');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const helmet = require('helmet');
const MongoStore = require('connect-mongo');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelpcamp';
mongoose.connect(dbUrl);
//mongoose.connect('mongodb://127.0.0.1:27017/yelpcamp');

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: secret
    }
});

store.on("error", function(e) {
    console.log(`SESSION STORE ERROR: ${e}`);
});

// used for input sanitization, basically just replaces
// any $ or period (.) with an empty string, as they can
// be used in mongo operators to retrieve large swathes
// of the db
const mongoSanitize = require('express-mongo-sanitize');

// mongoose.connection returns the mongoose connection object
const db = mongoose.connection;

// on is a method that adds a listener to the eventName, in this
// case, error, which is constantly listening for that event, 
// and does not cease execution until the connection does
db.on("error", console.error.bind(console, "connection error:"));

// once is a method that adds a one time event listener to
//  eventName, which in this case is "open"
db.once("open", () => {
    console.log("DB Connected");
});

app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/"
];
const connectSrcUrls = [
    // "https://api.mapbox.com/",
    // "https://a.tiles.mapbox.com/",
    // "https://b.tiles.mapbox.com/",
    // "https://events.mapbox.com/",
    "https://api.maptiler.com/"
];

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://res.cloudinary.com/dvsil1zfi/",
            "https://images.unsplash.com/",
            "https://api.maptiler.com"
        ]
    }
}));

const sessionConfig = {
    name: 'session',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        httpOnly: true,

        // only use cookies on HTTPS, however, it breaks
        // when testing locally since localhost is not 
        // secure
        //secure: true,

        //Date.now() is in milliseconds, so need to multiply 
        //to get to 1 day - 1000 ms in 1s, 60s in 1m, 60m in 1h,
        //24h in 1day
        expires: Date.now() + (1000 * 60 * 60 * 24),
        maxAge: 1000 * 60 * 60 * 24
    }
};
app.use(session(sessionConfig));

// allows the use of passport (authentication middleware for node)
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

// serializes and deserializes user sessions
// (basically just how to store and delete sessions)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// allows the use of flash messages and tracks the current user
app.use(flash());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/campgrounds', campRouter);
app.use('/campgrounds/:id/reviews', reviewRouter);
app.use('/', userRouter);

// app.get('/fakeUser', async (req, res) => {
//     const user = new User({email: 'colt@gmail.com', username: 'colt'});
//     const newUser = await User.register(user, 'chicken');
//     res.send(newUser);
// });

app.get('/', (req, res) => { 
    res.render('home');
});

app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError(`${req.originalUrl} cannot be found`, 404));
});

app.use((err, req, res, next) => {
    if (!err.msg) err.msg = 'Something went wrong';
    if (!err.status) err.status = 500;
    res.status(err.status).render('error', { err });
});

app.listen(3000, () => {
    console.log('Listening on 3000');
});