require('dotenv').config();
const { createServer } = require('http');
const express = require('express');
const compression = require('compression');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const passport = require('passport');

const normalizePort = port => parseInt(port, 10);
const PORT = normalizePort(process.env.PORT || 5002);

require('./server/models')(process.env.DB_CONN);

const app = express();
const dev = app.get('env') !== 'production';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: "nightlifesec",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));


if (dev) {
  app.use(morgan('dev'));
}

app.use(passport.initialize());
app.use(passport.session());

require('./server/config/passport')(passport);

const router = require('./server/routes/router');
app.use(router);

if (!dev) {
  app.disable('x-powered-by');
  app.use(compression());
  app.use(morgan('common'));

  app.use(express.static(path.join(__dirname, 'build')));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  })
}

const server = createServer(app);
server.listen(PORT, err => {
  if (err) throw err;
  console.log('Server started');
})
