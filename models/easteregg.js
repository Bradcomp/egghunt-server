'use strict';
const R = require('ramda');
const uuid = require('node-uuid');

//isValid :: Egg -> Bool
const isValid = egg => {
    let coords = R.path(['location', 'coordinates'], egg);
    if (R.any(coord => isNaN(coord), coords)) return false;
    if (!R.all(R.is(String), [egg.user, egg.icon])) return false;
    return true;
};

//EasterEgg :: String, Float, Float, String -> Egg?
const EasterEgg = (user, latitude, longitude, icon) => {
    let egg = {
        user,
        icon,
        id: uuid.v4(),
        guestBook: [],
        location: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
    };
    if (isValid(egg)) return egg;
    return false;
};

module.exports = EasterEgg;
