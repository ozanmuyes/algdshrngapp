'use strict';

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const InstagramStrategy = require('passport-instagram');
const shortid = require('shortid');
//

const SessionStore = require('./SessionStore');

const PORT = 1337;
const INSTAGRAM_CLIENT_ID = ''; // TODO
const INSTAGRAM_CLIENT_SECRET = ''; // TODO


const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
  users: [/* { id, email, password, instagramId?, instagramAccessToken?, instagramRefreshToken? } */],
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

db.read();


passport.use(new LocalStrategy(
  {
    usernameField: 'uname',
    passwordField: 'psw',
    passReqToCallback: true,
  },
  (req, username, password, done) => {
    const user = db.get('users')
      .find({ username })
      .value();

    if (!user) {
      done(null, false, { message: 'User not found.' });
      return;
    }

    if (password !== user.password) {
      done(null, false, { message: 'Wrong password.' });
      return;
    }

    done(null, user);
  },
));

passport.use(new InstagramStrategy(
  {
    clientId: INSTAGRAM_CLIENT_ID,
    clientSecret: INSTAGRAM_CLIENT_SECRET,
    callbackURL: `http://127.0.0.1:${PORT}/auth/instagram/callback`,
  },
  (accessToken, refreshToken, profile, done) => {
    //
    debugger;
    console.log(JSON.stringify({ accessToken, refreshToken, profile }));

    const Users = db.get('users');
    let user = Users
      .find({ instagramId: profile.id })
      .value();

    if (!user) {
      // create

      user = Users.push({
        id: shortid.generate(),
        username: profile.username,
        // TODO password???
        instagramAccessToken: accessToken,
        instagramRefreshToken: refreshToken,
      }).write();
    } else {
      // update
    }

    done(null, user);
  },
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = db.get('users')
    .find({ id })
    .value();

  done(null, user);
});


const app = express();

// Set up app view - Handlebars
//
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    flashTypeToBootstrap: (flashType, options) => {
      let bootstrapAlertType;

      switch (flashType) {
        case 'info':
          bootstrapAlertType = 'primary';
          break;

        case 'success':
          bootstrapAlertType = 'success';
          break;

        case 'error':
          bootstrapAlertType = 'danger';
          break;

        case 'warning':
          bootstrapAlertType = 'warning';
          break;

        default:
          bootstrapAlertType = 'secondary';
      }

      return bootstrapAlertType;
    },
    //
  },
}));
app.set('view engine', 'hbs');

// Configure session middleware
//
app.use(session({
  secret: 'bHbC5U0#e+:;_~R',
  name: 'algdshrngapp-session',
  resave: false,
  saveUninitialized: false,
  store: new SessionStore(db),
}));
app.use(require('flash')());
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method !== 'POST' && req.session.flash && Array.isArray(req.session.flash) && req.session.flash.length > 0) {
    res.flash = req.session.flash.slice();
    req.session.flash = [];
    // TODO Maybe touch on the session on the store (db)
  } else {
    res.flash = [];
  }

  next();
});

// Routes
//
app.get('/', (req, res) => {
  const user = null; // TODO Get from `req.user` if any

  res.render('home', { flash: res.flash, user });
});

app.get('/login', (req, res) => { res.render('login'); });

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
}));

// TODO upload


app.listen(PORT, () => {
  console.log(`listening on port ${PORT}.`);
});
