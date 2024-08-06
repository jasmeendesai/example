const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require('dotenv').config();
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());



//const mongoose = require('mongoose');

async function connectDB() {
  try {
    const connectionString = process.env.DATABASE_URL; // Replace with your actual URI
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // ...other options if needed...
    };

    await mongoose.connect(connectionString, options);
    console.log('Connected to MongoDB!');

    // Now you can interact with your database here...

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    // Handle the error (e.g., exit the process if it's critical)
  }
}

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: { type: String, required: true},
    resetPasswordToken: { type: String},
    resetPasswordExpires: { type: Date},
});
const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try{
        const existingUser = await User.findOne({ email, username});
        if(existingUser) {
            return res.status(400).json({ message: 'User already exists with username or email' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Something went wrong' });
    }
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if(!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordcorrect = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordcorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "2h"} )
        return res.status(200).json({ result: existingUser, token})
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'something went wrong',  error: error.message})
    }
})


app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from
        await user.save();
    
        // const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
        // const message = `Click on this link to reset your password: ${resetURL}`;
        
        const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
        const message = `Click on this link to reset your password: ${resetURL}`;




        await sendEmail(email, 'Password Reset Request', message);

        res.status(200).json({ message: 'Password reset link sent' });
    } catch (error) {
        console.error('Error during forgot password:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});


// function formatDateInUTC(date, formatString = 'YYYY-MM-DDTHH:mm:ssZ') {
//     return moment.utc(date).format(formatString); // Formats date as a string in UTC
//   }

function formatDateInUTC(date, timeZone = 'Europe/London', formatString = 'YYYY-MM-DDTHH:mm:ssZ') {
    return moment.tz(date, timeZone).utc().format(formatString); // Parse with time zone and convert to UTC
}

function getCurrentTimeInUTC(timeZone, formatString = 'YYYY-MM-DDTHH:mm:ssZ') {
    return moment.tz(moment(), timeZone).utc().format(formatString); // Get current time, convert to specified time zone, then to UTC
}

app.post('/current-time-utc', (req, res) => {
    const { timeZone, formatString } = req.body; // Expecting timeZone and optional formatString from request

    if (!timeZone) {
        return res.status(400).json({ error: 'timeZone is a required field' });
    }

    try {
        // Get current time in specified time zone and convert to UTC
        const utcTime = getCurrentTimeInUTC(timeZone, formatString || 'YYYY-MM-DDTHH:mm:ssZ');
        res.json({ utcTime });
    } catch (error) {
        res.status(500).json({ error: 'Error getting current time', details: error.message });
    }
});

//   app.post('/format-utc', (req, res) => {
//     const { date, formatString } = req.body; // Expecting date and format string from request
    
//     // Convert and format date
//     const formattedDate = formatDateInUTC(date, formatString);
//     res.json({ formattedDate });
// });

app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    console.log('Received token:', token);
    console.log('Received password:', password);

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('Invalid or expired token');
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});

  


  async function sendEmail(to, subject, text) {
      const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });
  
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: to, // Corrected email recipient
          subject: subject,
          text: text, // Corrected token substitution
      };
  
      await transporter.sendMail(mailOptions);
  }
  
    


// Call the function to initiate the connection
connectDB(); 


app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`);
})