const router = require('express').Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const requireAuth = require('../middlewares/requireAuth');
const {Assignment}=require('../models/model');
router.use(requireAuth);

/* function to get the current time according to local timezone */
function getLocalTime(){
    let currentDate=new Date();
    let timezoneOffset = currentDate.getTimezoneOffset() * 60000;
    let currentDateLocal = new Date(currentDate.getTime() - timezoneOffset);
    return currentDateLocal;
}

/* function to create an array of objects from an array of strings */
function getObjectId(objects) {
    let newObjects = [];
    if (objects && objects.length > 0) {
        objects.forEach(obj => {
            newObjects.push(mongoose.Types.ObjectId(obj.toString()));
        });
    }
    return newObjects;
}

/*  This function takes date and time as input and returns it in datetime format.*/
function getPublishedDateTime(pdate,pTime){
    let published = new Date(pdate);

    const [time, modifier] = pTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
       hours = '00';
    }
   if (modifier === 'PM') {
       hours = parseInt(hours, 10) + 12;
    }
    if(hours<12){
        hours='0'+hours;
    }
    published.setUTCHours(hours,minutes,0,0);
    return published;
}

/* Allows teachers to create an assignment */
router.post('/create', async(req,res)=>{
    if(req.user.type==='teacher'){
        let assignment = new Assignment();

        let students = [];
        let studentData=[];
        if (req.body.students && req.body.students.length) {
            students = getObjectId(req.body.students);
        }
        students.forEach(student=>{
            studentData.push({student:student});
        });
   
        assignment.students=studentData;

        assignment.description=req.body.description;
        assignment.teacher=req.user._id;
        
        /* if published date and time is passed in the body, it compares it with current time
            and changes the status to SCHEDULED or ONGOING
            else current time is assigned and status is set as ONGOING
        */
        if(req.body.publishedDate && req.body.publishedTime){
            let currentDateLocal = getLocalTime();
            
            let published = getPublishedDateTime(req.body.publishedDate, req.body.publishedTime);
            assignment.published=published;
            if(published>currentDateLocal){
                assignment.status="SCHEDULED";
            }
            else{
                assignment.status="ONGOING";
            }
        }
        else{
            assignment.status="ONGOING";
        }
        let deadline = new Date(req.body.deadline);
        deadline.setUTCHours(23,59,59,999);
        assignment.deadline=deadline;
        assignment.save(function(err, result) {
            if(err) {
                return res.status(400).send(err);
            } else {
                res.send(result);
            }
        });
    }
    else{
        res.send('students cannot create assignments')
    }
});

/* Allows teachers to update an assignment
    Returns a message if the teacher hasn't published this assignment
*/
router.post('/updateAssignment', async(req,res)=>{
    if(req.user.type==='teacher'){

        Assignment.findById(req.body.id).populate('teacher').exec(function (err, result) {
            if (err) {
                return res.status(400).send(err);
            } else {
                if(result.teacher._id==req.user.id){
                    let updateObj={};
                    if(req.body.description){
                        updateObj.description=req.body.description
                    }

                    if(req.body.students && req.body.students.length){
                        let students = [];
                        let studentData=[];
                        students = getObjectId(req.body.students);
                        
                        students.forEach(student=>{
                            studentData.push({student:student});
                        });
   
                        updateObj.students=studentData;
                    }

                    if(req.body.publishedDate && req.body.publishedTime){
                        let currentDateLocal = getLocalTime();
                        
                        let published = getPublishedDateTime(req.body.publishedDate, req.body.publishedTime);
                        updateObj.published=published;
                        if(published>currentDateLocal){
                            updateObj.status="SCHEDULED";
                        }
                        else{
                            updateObj.status="ONGOING";
                        }
                    }

                    if(req.body.deadline){
                        let deadline=new Date(req.body.deadline);
                        deadline.setUTCHours(23,59,59,999);
                        updateObj.deadline=deadline;
                    }

                    Assignment.updateOne({_id:req.body.id},{
                        $set:updateObj
                    }).exec(function(err,result){
                        if(err){
                            return res.status(400).send(err);
                        }
                        else{
                            res.send(result);
                        }
                    });    
                    }
                else{
                    res.send("you haven't published this assignment")
                }
            }
        }); 
    }
    else{
        res.send('students cannot update assignments')
    }
});

/* Allows teachers to delete an assignment
    Returns a message if the teacher hasn't published this assignment
*/
router.delete('/deleteAssignment', async(req,res)=>{
    if(req.user.type==='teacher'){
        Assignment.findById(req.body.id).populate('teacher').exec(function (err, result) {
            if (err) {
                return res.status(400).send(err);
            }
            else{
                if(result.teacher._id==req.user.id){
                    Assignment.deleteOne({_id:req.body.id}).exec(function (err, result) {
                        if (err) {
                            return res.status(400).send(err);
                        } else {
                            res.send(result);
                        }
                    }); 
                }
                else{
                    res.send("you haven't published this assignment")
                }
            }
        }); 
    }
    else{
        res.send('students cannot delete assignments')
    }
});


/* Returns all assignments published by a teacher
   Returns all assignments assigned to a student
*/
router.get('/view', async(req,res)=>{
    let query={};
    if(req.user.type==='teacher'){
        query={teacher:req.user.id};
    }
    else{
        query={students:{$elemMatch:{student:req.user.id}}};
    }

    Assignment.find(query).populate('teacher').populate('students.student').exec(function (err, result) {
        if (err) {
            return res.status(400).send(err);
        } else {
            res.send(result);
        }
    }); 
});

/* Filters assignments published by a teacher according to status
   Filters assignments assigned to a student according to status
*/
router.post('/filterByPublishedDate', async(req,res)=>{
    let query={};
    if(req.user.type==='teacher'){
        query={$and:[{teacher:req.user.id},{status:req.body.status}]}
    }
    else{
        query={$and:[{students:{$elemMatch:{student:req.user.id}}},{status:req.body.status}]}
    }
    Assignment.find(query).populate('teacher').populate('students.student').exec(function (err, result) {
        if (err) {
            return res.status(400).send(err);
        } else {
            console.log(req.user.id,req.user.type)
            res.send(result);
        }
    }); 
});

/* Returns details of an assignment */
router.post('/check', async(req,res)=>{
    Assignment.findById(req.body.id).populate('teacher').populate('students.student').exec(function (err, result) {
        if (err) {
            return res.status(400).send(err);
        } else {
            res.send(result);
        }
    }); 
});


module.exports = router;