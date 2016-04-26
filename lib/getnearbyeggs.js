'use strict';
const query = require('./mongo').query;
const curry = require('ramda/src/curry');

const getNearbyPoints = curry((radius, location) => {
    const eggLocation = {
        location: {
            $near: {
                $geometry : {
                    type : "Point" ,
                    coordinates : location
                },
                $maxDistance : radius
            }
        }
    }
    console.log(location);
    return query('eggs', eggLocation);
});

module.exports = getNearbyPoints;
