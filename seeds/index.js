const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');

mongoose.connect('mongodb://127.0.0.1:27017/yelpcamp');

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

// easy way to pick a random index in an array:
const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

//used to 
const seedDB = async() => {
    // delete all previous data
    await Campground.deleteMany({});
    await Review.deleteMany({});
    for(let i = 0; i < 50; i++){
        const rand = Math.floor(Math.random() * 1000);
        const p = Math.floor(Math.random() * 20) + 10;
        const loc = `${cities[rand].city}, ${cities[rand].state}`;
        const i = [
            {
                url: 'https://res.cloudinary.com/dvsil1zfi/image/upload/v1741295703/YelpCamp/m1onxjmuuzz7lqw9aj2y.jpg',
                filename: 'YelpCamp/m1onxjmuuzz7lqw9aj2y'
            },
            {
                url: 'https://res.cloudinary.com/dvsil1zfi/image/upload/v1741295702/YelpCamp/ifxdldmzx3fqojuylecb.jpg',
                filename: 'YelpCamp/ifxdldmzx3fqojuylecb'
            }
        ];
        const c = new Campground({
            title: `${sample(descriptors)} ${sample(places)}`,
            location: loc,
            images: i,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[rand].longitude,
                    cities[rand].latitude
                ]
            },
            description: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non est ipsam obcaecati optio repellendus blanditiis iure vitae rerum cupiditate suscipit. Ipsam praesentium ea accusantium nisi voluptatem quas pariatur iure debitis. Veritatis libero beatae laboriosam incidunt doloribus corporis vel neque adipisci praesentium, dolores eligendi porro? Voluptate tenetur deserunt, architecto veniam aliquid facere voluptatibus temporibus sint aperiam, sequi dolor, sunt omnis enim!',
            price: p,
            author: '67c646ce60b5d6e1faf6f9a2'
        });
        await c.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});