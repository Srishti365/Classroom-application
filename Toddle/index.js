const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieparser=require('cookie-parser');

mongoose.connect('mongodb://localhost/classroom',{useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })
    .then(()=> console.log("database connected"))
    .catch((error)=>console.log(error));

require('./models/model')
app = express();
app.use(cookieparser());
app.use(cors({credentials:true, origin:['http://localhost:4200']}));
app.use(express.json());

app.use('/user', require('./routes/user'));
app.use('/assignment', require('./routes/assignment'));
app.use('/submission',require('./routes/submission'));

app.listen(3000,()=> console.log('server connected to port 3000') );