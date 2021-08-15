const router = require('express').Router();
const mongoose = require('mongoose');
const async = require('async');
const requireAuth = require('../middlewares/requireAuth');
const {Assignment, Submission}=require('../models/model');
router.use(requireAuth);

function getLocalTime(){
    let currentDate=new Date();
    let timezoneOffset = currentDate.getTimezoneOffset() * 60000;
    let currentDateLocal = new Date(currentDate.getTime() - timezoneOffset);
    return currentDateLocal;
}

/* Allows students to add submission for an assignment they are assigned to
    Returns a message if the user is a teacher or if the user isn't assigned to the task
*/
router.post('/add', async(req,res)=>{
    if(req.user.type==='student'){
        //if assignment has already been submitted, do not allow submission
        Submission.find({assignment:req.body.assignment,student:req.user.id}).exec(function (err, result) {
            if (err) {
                return res.status(400).send(err);
            } else {
                if(result.length){
                    res.send("you have already submitted the assignment")
                }
                else{
                    //check if this student has been assigned this task

                    Assignment.find({_id:req.body.assignment,students:{$elemMatch:{student:req.user.id}}}).populate('teacher').exec(function (err, result) {
                        if (err) {
                            return res.status(400).send(err);
                        } else {
                            if(result && result.length){
                                let submission= new Submission();
                                if(req.body.remark){
                                    submission.remark=req.body.remark;
                                }
                                submission.assignment=req.body.assignment;
                                submission.student=req.user.id;
                                submission.teacher=result[0].teacher._id;
                                submission.save(function(err, result) {
                                    if(err) {
                                        return res.status(400).send(err);
                                    } else {
                                        res.send(result);
                                    }
                                });
                            }
                            else{
                                res.send("You havent been assigned to this task")
                            }
                        }
                    }); 
                }
            }
        }); 

    }
    else{
        res.send("You aren't a student")
    }
    
});

/* Returns all submissions of an assignment published by the teacher
    Returns the student's submission for a particular assignment
*/
router.get('/details', async(req,res)=>{
    let query={};
    if(req.user.type==='teacher'){
        query={$and:[{teacher:req.user.id},{assignment:req.body.assignment}]}
    }
    else{
        query={$and:[{student:req.user.id},{assignment:req.body.assignment}]}
    }

    Submission.find(query).populate('assignment').populate('student').populate('teacher').exec(function (err, result) {
        if (err) {
            return res.status(400).send(err);
        } else {
            res.send(result);
        }
    }); 
});


/* Filters submission on the basis of keys "all","pending","submitted" and "overdue" */
router.get('/filter', async(req,res)=>{
    if(req.user.type==='student'){
        let finalData=[];
        //all assignments assigned
        if(req.body.all){
            Assignment.find({students:{$elemMatch:{student:req.user.id}}}).populate('teacher').exec(function (err, result) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    res.send(result)
                }
            }); 
        }
        //assignments that have been assigned but havent been submitted, and deadline isnt over
        else if(req.body.pending){
            Assignment.find({students:{$elemMatch:{student:req.user.id}}}).exec(function (err, result) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    async.each(result, function (assign,callback) {
                        Submission.find({assignment:assign._id,student:req.user.id}).populate('assignment').populate('teacher').exec(function (err, result) {
                            if (err) {
                                return res.status(400).send(err);
                            } else {
                                if(result.length===0){
                                    let currentDateLocal=getLocalTime();
                                    if(assign.deadline>currentDateLocal){
                                        console.log(assign)
                                        finalData.push(assign);    
                                    }
                                }
                            }
                            callback(null)
                        });
                        
                    }, function (err) {
                        if (err) console.log('error - ', err);
                        else {
                            res.send(finalData);
                        }
                    });
    
                }
            }); 
        }
        //assignments that have been assigned but havent been submitted, and deadline is over
        else if(req.body.overdue){
            Assignment.find({students:{$elemMatch:{student:req.user.id}}}).exec(function (err, result) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    async.each(result, function (assign,callback) {
                        Submission.find({assignment:assign._id,student:req.user.id}).populate('assignment').populate('teacher').exec(function (err, result) {
                            if (err) {
                                return res.status(400).send(err);
                            } else {
                                if(result.length===0){
                                    let currentDateLocal=getLocalTime();
                                    if(assign.deadline<currentDateLocal){
                                        console.log(assign,req.user.id)
                                        finalData.push(assign)
                                    }
                                }
                            }
                            callback(null)
                        });
                    }, function (err) {
                        if (err) console.log('error - ', err);
                        else {
                            // console.log(finalData)
                            res.send(finalData);
                        }
                    });

                    
    
                }
            }); 
        }
        //all assignments submitted
        else if(req.body.submitted){
            Submission.find({student:req.user.id}).populate('assignment').populate('teacher').exec(function (err, result) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    res.send(result);
                }
            });
        }
        else{
            res.send("not a valid option")
        }
    }
        
    else{
        res.send("this api is only applicable to students")
    }
});

/* Returns details of a submission */
router.get('/check', async(req,res)=>{
    Submission.find({}).populate('assignment').populate('student').populate('teacher').exec(function (err, result) {
        if (err) {
            return res.status(400).send(err);
        } else {
            res.send({"result":result,"userid":req.user.id, "usertype":req.user.type});
        }
    }); 
});

module.exports = router;