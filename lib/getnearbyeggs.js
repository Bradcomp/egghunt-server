'use strict';
const query = require('./mongo').query('eggs');

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
    return query(eggLocation);
}

module.exports = getNearbyPoints;
