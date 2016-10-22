/*
/Get a movie name if the input is a number or display a list of
/movies if the seasrch is a string.
*/

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var passport = require('passport');
var nodemailer = require('nodemailer');
LocalStrategy = require('passport-local').Strategy;

mongoose.connect('mongodb://madhavank:thulasi12@localhost:27017/movieDB');
var app = express();
app.use(passport.initialize());
app.use(passport.session());
var bodyParser = require('body-parser');
app.use(bodyParser());

var uniqueUser = "";
var passdetails = "";
//define model
var movieStat = mongoose.model('movieStat', {user:String, movie: String});
var userDetails = mongoose.model('userDetails',{user:String, password:String, email:String});

app.get('/find', function(req, res) {
    // The form's action is '/' and its method is 'POST',
    // so the `app.post('/', ...` route will receive the
    // result of our form
    var html = '<form action="/find" method="post">' +
        'Enter random number or search a movie name:' +
        '<input type="text" name="movieName" placeholder="..." />' +
        '<br>' +
        '<button type="submit">Submit</button>'+'.<br>' +

        '</form>';

    res.send(html);
});

app.post('/find', function(req, res) {

        //dont show if logged out

        if(uniqueUser !== ""){

    //this could be a number or a name, so validate
        var movieName = req.body.movieName;

    var isNumber = 0;
    if (isNaN(movieName)) {
        url = 'http://www.imdb.com/find?q=' + movieName + '&s=tt';

                var movieToInsert = new movieStat({user:uniqueUser, movie: movieName});
                movieToInsert.save(function (err, userObj) {
                if (err) {
                        console.log(err);
                } else {
                        console.log('saved successfully:', userObj);
                }
                });


        isNumber = 0;
    } else {
        url = 'http://www.imdb.com/title/tt' + movieName + '/';
        isNumber = 1;
    }





    console.log(url);
    console.log(isNumber);
        request(url, function(error, response, html) {
        if (!error) {

            var $ = cheerio.load(html);

            var title, release, rating;
            var json = {
                title: "",
                release: "",
                rating: ""
            };

                        //This tag identifies the title
            $('.title_wrapper').filter(function() {
                var data = $(this);

                title = data.children().first().text().trim();
                release = data.children().last().children().last().text().trim();

                json.title = title;
                json.release = release;
            })



            $('.ratingValue').filter(function() {
                var data = $(this);
                rating = data.text();

                json.rating = rating;
            })



                        //Iterate through search results.
            var tdtotal = "";

            $('.result_text').each(function() {
                                var e = ($(this).html()).replace("/title/", "http://www.imdb.com/title/");
                                e.link(e);
                tdtotal += (e) + '.<br>';
            });



        }


        if (isNumber == 1) {
            var html = '<a href="/find">Try again.</a>'+'<br>'+'<a href="/search">Stats.</a>'+'<br>'+'Movie: ' + title + '.<br>' + 'Release: ' + release + '.<br>' + 'Rating: ' + rating + '.<br>' + '.<br>' + tdtotal+'<br>'
                        +'<a href="/logout">Log out</a>';

        } else {
            var html = '<a href="/find">Try again.</a>'+'<br>'+'<a href="/logout">Log out</a>'+'<br>'+'<a href="/search"><b>Stats.</b></a>'+ '.<br>'+tdtotal;

        }
        res.send(html);

    })

}else{
        res.send('You are not logged in '+'<br>'+'<a href="/">Login</a>');
}
})

//login - passport
app.post('/',
  passport.authenticate('local', {
    successRedirect: '/find',
    failureRedirect: '/loginFailure'
  })
);

app.get('/loginFailure', function(req, res, next) {
  res.send('Failed to authenticate');
});

app.get('/loginSuccess', function(req, res, next) {
  res.send('Successfully authenticated');
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new LocalStrategy(function(username, password, done) {
  process.nextTick(function() {
          uniqueUser = username;
    userDetails.findOne({
      user:username,
    }, function(err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      if (user.password != password) {
        return done(null, false);
      }

      return done(null, user);
    });
  });
}));
//end passport


app.get('/collections',function(req,res){
  db.driver.collectionNames(function(e,names){
    res.json(names);
  })
});


app.get('/search',function(req,res){
        console.log ('Unique user is '+uniqueUser);
  movieStat.find({user:uniqueUser},'-_id -__v -user', function (err, userObj) {
  if (err) {
    console.log(err);
  } else if (userObj.length) {
    console.log('Found:', userObj);
        res.send('Movies you have searched in the past '+'.<br>'+userObj+'<a href="/find">Try again.</a>');
  }else{
          res.send('You are not logged in '+'<br>'+'<a href="/">Login</a>');
  }
})
});


app.get('/',function(req,res){
        res.sendfile('views/login.html');
});


app.get('/register',function(req,res){
        res.sendfile('views/register.html');
});

app.get('/forgotpass',function(req,res){
        res.sendfile('views/forgotpass.html');
});

app.post('/forgotpass', function(req, res){
     var uniqueUser = req.body.regemail;
     var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'randommoviesearch@gmail.com', // Your email id
            pass: 'thulasi12' // Your password
        }
    });


     userDetails.find({email:uniqueUser},'-_id -__v', function (err, userObj) {
  if (err) {
    console.log(err);
    res.send('Error Occurred');
  } else if (userObj.length) {
    console.log('Found:', userObj);
          passdetails = userObj;

 var str  = JSON.stringify(passdetails);
   console.log(str);
var start = str.indexOf("email");
var end = str.indexOf("}");
    var  em= str.substring(start+8, end -1);
console.log('is this the email?',em);
var mailOptions = {
    from: 'randommoviesearch@gmail.com', // sender address
    to: em, // list of receivers
    subject: 'Random Movie Search Password Reset', // Subject line
    text: str //, // plaintext body
    // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    };

   transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
        res.send('Error');
    }else{
        console.log('Message sent: ' + info.response);
        res.send('Email with password sent'+'.<br>'+'<a href="/">Login</a>')
        //res.json({yo: info.response});
        };
        });
 }else{
console.log('Nothing found');
res.send ('No records found');
}
})



});
app.post('/register', function(req, res) {
        var userName = req.body.username;
        var pass = req.body.password;
        var rePass = req.body.repassword;
        var email = req.body.emailid;
        //check if userid exists
        userDetails.find({user:userName}, function (err, userObj) {
  console.log('User Obj:',userObj);
  if (err) {
    console.log(err);
  } else if (userObj.length) {

        console.log('UID Exists:');
        res.send('User exists');
  }
  else if(pass!=rePass){
          res.send('Passwords dont match');
  }
  else{
         var query = userDetails.find({email:email}).select('email');
         var emailcheck;
          query.exec(function (err, someVal){
           if(err) console.log('Test query error');
       console.log('No error:', someVal);
       if(someVal.length){
        res.send('Email id already exists');
        }else{
          console.log('New User.');
          var insertUser = new userDetails({user:userName, password:pass, email:email});
                                insertUser.save(function (err, userObj) {
                if (err) {
                        console.log(err);
                } else {
                        console.log('saved user successfully:', userObj);
                }
                });

                                 res.send('User Added'+'.<br>'+'<a href="/">Login</a>')

        }
        });

}

})


                                //test code
});



//logout
app.get('/logout',
  function(req, res) {
   uniqueUser = "";
   res.send('Logged out'+'<a href="/">Login</a>');
  });
app.listen('8080')
console.log('Listening on port 8080');
exports = module.exports = app;
                                    
