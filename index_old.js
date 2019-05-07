'use strict';

const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const multer = require('multer');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const csrf = require('csurf');
// const cookieParser = require('cookie-parser');


const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
  users: [],
  sessions: [],
  images: [],
  coupons: [],
}).write();

db._.mixin({
  upsert: function(collection, obj, key) {
    key = key || 'id';
    for (var i = 0; i < collection.length; i++) {
      var el = collection[i];
      if(el[key] === obj[key]){
        collection[i] = obj;
        return collection;
      }
    };
    collection.push(obj);
  }
});


const app = express();

app.engine('hbs', exphbs({ defaultLayout: 'main', extname: '.hbs' }));
app.set('view engine', 'hbs');

// app.use(bodyParser.urlencoded({ extended: true }));

db.read();
const SessionStore = require('./SessionStore');
app.use(session({
  name: 'algdshrngapp-session',
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 2.592e+9,
    sameSite: true,
  },
  secret: 'bHbC5U0#e+:;_~R',
  store: new SessionStore(db),
}));
app.use(passport.initialize());
app.use(passport.session());


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}`),
});

const upload = multer({ storage });

const csrfProtection = csrf(/* { cookie: true } */);
const parseForm = bodyParser.urlencoded({ extended: true });


app.get('/', (req, res) => {
  // console.log(req.session.)
  res.render('home');
});
app.get('/login', csrfProtection, (req, res) => {
  if (req.session && req.session.cookie) {
    res.redirect('/');
  } else {
    res.render('login', { csrfToken: req.csrfToken() });
  }
});
app.post('/login', parseForm, csrfProtection, (req, res) => {
  console.log('logged in');

  res.redirect('/');
});
app.get('/upload', (req, res) => res.render('upload'));
app.post('/upload', upload.single('picture'), (req, res) => {
  /**
   * `req.file` = {
   *   destination:"uploads",
   *   encoding:"7bit",
   *   fieldname:"picture",
   *   filename:"picture-1557152306274",
   *   mimetype:"image/png",
   *   originalname:"logo.png",
   *   path:"uploads\picture-1557152306274",
   *   size:23955,
   * }
   */

  const img = fs.readFileSync(req.file.path);
  // const encode_image = img.toString('base64');
  // // Define a JSONobject for the image attributes for saving to database

  // const finalImg = {
  //   contentType: req.file.mimetype,
  //   image: new Buffer(encode_image, 'base64'),
  // };

  // TODO DB persistence (for image and for coupon code)

  res.send('OK');
});
//


app.listen(1337, () => {
  console.log('ALGDSHRNGAPP listening on port 1337.');
});
