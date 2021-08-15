const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

/*  Takes type(teacher/student), username and password as parameters 
    and registers the user 
*/
router.post('/register', async(req,res)=>{
    const salt = await bcrypt.genSalt(10);
    const hashedpass = await bcrypt.hash(req.body.password, salt);
    const user = new User({
        type: req.body.type,
        email: req.body.email,
        password: hashedpass
    });

    const result=await user.save();
    const {password, ...data}=await result.toJSON();
    res.send(data);
});

/*Logs in a registered user if the credentials are correct*/
router.post('/login', async(req,res)=>{
    const user = await User.findOne({email:req.body.email});
    if(!user){
        return res.status(404).send({
            message: 'user not found'
        })
    }

    if(!(await bcrypt.compare(req.body.password, user.password))){
        return res.status(400).send({
            message: 'Invalid credentials'
        })
    }

    const token = jwt.sign({_id:user._id},"secret");

    res.send({'token':token});
});


module.exports = router;