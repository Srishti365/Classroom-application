const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
    type:{
        type: String,
        enum: ['teacher', 'student'],
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true
    }
});

const User = mongoose.model("User", UserSchema);

const AssignmentSchema = new mongoose.Schema({
    description:{
        type:String
    },
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    students:[{
        student:{
            type: Schema.Types.ObjectId,
            ref:'User'
        }
    }],
    published: {
        type: Date,
        default: Date.now
    },
    deadline: {
        type: Date,
        default: Date.now,
        required: true
    },
    status:{
        type:String
    }
})

const Assignment = mongoose.model("Assignment", AssignmentSchema);

const SubmissionSchema = new mongoose.Schema({
    remark:{
        type: String
    },
    assignment: {
        type: Schema.Types.ObjectId,
        ref: 'Assignment'
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    submissionTime:{
        type: Date,
        default: Date.now
    },
    status: {
        type: String
    }
})

const Submission = mongoose.model("Submission", SubmissionSchema);

module.exports = { User: User, Assignment: Assignment, Submission: Submission };