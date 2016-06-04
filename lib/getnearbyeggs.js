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
    return query('eggs', eggLocation);
});

module.exports = getNearbyPoints;
