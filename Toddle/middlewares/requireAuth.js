const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(422).send({ errror: 'You must be logged in!' });
    }

    jwt.verify(authorization, 'secret', async (err, payload) => {
        if (err) {
            return res.status(422).send({ errror: 'You must be logged in!' });
        }

        const { _id } = payload;
        const user = await User.findById(_id);
        req.user = user;
        next();
    })
};
