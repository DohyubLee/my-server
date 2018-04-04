const express = require('express');
const session = require('express-session');
const bkfd2Password = require("pbkdf2-password");  //암호 인증 모듈
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; 
const pool = require('./db-config').connection;

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  console.log('this is middleware');
  next();
});
app.use(session({
  secret: '1234qwert',  // 내가 임의로 넣어줌
  resave: false,
  saveUninitialized: true,
  store: new MySQLStore({   //sessions 디렉토리 생성됨, session이 저장될곳
    host:'localhost',
    port:3306,
    user:'root',
    password:'2ehguq',
    database:'board'
  })
}));
app.use(passport.initialize());
app.use(passport.session());  //session 미들웨어가 먼저 선행되어야함

passport.serializeUser(function(user, done) {    //딱 한번 호출됨, 그담부터 deserializeUser 실행
  console.log('serializeUser', user);
  done(null, user.email);   //session에 저장, 식별자로 사용할값 지정해줌
});
passport.deserializeUser(function(id, done) {  //serializeUser통해 한번 session이 생성된유저는 여기로 실행됨
  console.log('deserializeUser', id);
  var sql = 'SELECT * FROM user WHERE email=?';
  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      return done('There is no user.');
    } else {
      done(null, results[0]);
    }
  })
});
passport.use(new LocalStrategy({ //'local' 인증방식사용시 설정해야함
    usernameField: 'email',
  },  
  function(username, password, done) {  //username, password는 form에서 전달된 정보
    var username = username;
    var pwd = password;
    var sql = 'SELECT * FROM user WHERE email=?';
    pool.query(sql, [username], (err, results) => {
      if (err) {
        return done('There is no user.');
      }
      var user = results[0];
      if (pwd === user.password) {
        console.log('LocalStrategy', user);
        done(null, user);
      } else {
        done(null, false);
      }
    })
  }
));
app.post('/login', passport.authenticate(
  'local',
  {
    failureFlash: false
  }
), (req, res) => {
  res.json({ status: 'login'});
})
app.post('/register', (req, res) => {  //회원가입
  let user = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name
  };
  const USER_INSERT_SQL = `
    INSERT INTO 
      board.user 
      (email, 
        name, 
        password, 
        regDate) 
    VALUES
    (?, ?, ?, now())`;
    pool.query(USER_INSERT_SQL, [user.email, user.name, user.password], function(error, result) {
      if (error) {
        res.status(400);
        return;
      } else {
        req.login(user, () => {
          req.session.save(() => {
            res.status(200).json({ msg: 'insert success!', status: true });
          })
        })
      }
    });
});
app.get('/logout', (req, res) => {
  req.logout();  //session 지워줌
  req.session.save(() => {
    res.json({ status: 'logout'});
  });
})
app.get('/', (req, res) => {
  console.log('this is get router');
  res.status(200).json({success: true});
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
  console.log('press ctrl + c exit');
});
