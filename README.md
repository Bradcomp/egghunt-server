#Egghunt API
An API for servicing the Egghunt iOS app that doesn't exist yet.

All responses will have either a data field containing the response data,
or an error field with the relevant information.

##Authentication
Authentication can be set via an authentication header.

`authentication: apiKey`

You get the apiKey when you create a user.  All endpoints are authenticated.

## API endpoints

### GET /eggs
Returns a list of the found eggs for the user.  

Response:
```javascript
{
    "data": [Egg]
}
```

###POST /eggs
Adds a new egg at the specified location.
* Must be at least 25 meters away from existing eggs.
* Required fields in the body: `latitude`, `longitude`, `icon`
* icon is a single unicode character (should be an emoji).

Response:
```javascript
{
    "data": {
        "created": Boolean,
        "egg": Egg?
    }
}
```

###GET /eggs/check
Checks for an egg at a specified location.  Takes a latitude and longitude query parameter.
Will add the egg to the foundEggs for the User.

Response:
```javascript
{
    "data": {
        "found": Boolean,
        "egg": Egg?
    }
}
```

###PUT /eggs/guestbook
Adds your signature to the guestbook for the egg.  Expects a body with a
single field - egg - which contains the egg ID.

Response:
```javascript
{
    "data": {
        "signed: Boolean"
    }
}
```

###POST /users
Creates a user.  You don't need a body.  Currently requires admin authentication.

Response:
```javascript
{
    "data": {
        "apiKey": "String",
        "id": "UUID"
    }
}
```

###PUT /users/signature
Expects a body with a single field - `signature`.  The field should contain a string.

Response:
```javascript
{
    "data": {
        "signature": "String"
    }
}
```
