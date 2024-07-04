const express = require('express');
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// dotenv
dotenv.config();

// 모든 도메인에서 cors 허용
app.use(cors());

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
// cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// passport initialize
app.use(passport.initialize());

// mongoose connect
mongoose.connect(process.env.MONGO_URI,{
    dbName: process.env.MONGO_DBNAME
})
.then( res => console.log(`mongoDB ${process.env.MONGO_DBNAME} collection connected`))
.catch( err => console.log(err));
mongoose.connection.on('err', (err) => {
    console.log("mongoDB err");
});


// app.get (front routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});



app.listen(process.env.PORT, () => {
    console.log(`${process.env.PORT} server port connected`);
});