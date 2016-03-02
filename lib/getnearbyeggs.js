'use strict';
const query = require('./mongo').query;

const getNearbyPoints = (radius, latitude, longitude) => {
    const eggLocation = {
        location: {
            $near: {
                $geometry : {
                    type : "Point" ,
                    coordinates : [longitude, latitude]
                },
                $maxDistance : radius
            }
        }
    }
    return query('eggs', eggLocation);
}

module.exports = getNearbyPoints;
