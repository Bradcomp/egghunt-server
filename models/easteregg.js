'use strict';
const R = require('ramda');
const uuid = require('node-uuid');
const S = require('sanctuary');

//isValid :: Egg -> Bool
const isValid = egg => {
    let coords = R.path(['location', 'coordinates'], egg);
    if (R.any(coord => isNaN(coord), coords)) return false;
    if (!R.all(R.is(String), [egg.user, egg.icon])) return false;
    return true;
};

//EasterEgg :: String, Float, Float, String -> Maybe Egg
const EasterEgg = (user, latitude, longitude, icon) => {
    const egg = {
        user,
        icon,
        id: uuid.v4(),
        guestBook: [],
        location: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
    };
    if (isValid(egg)) return S.Just(egg);
    return S.Nothing();
};

module.exports = EasterEgg;
