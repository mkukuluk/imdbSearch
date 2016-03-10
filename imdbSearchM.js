/*
/Get a movie name if the input is a number or display a list of 
/movies if the seasrch is a string.
*/

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

mongoose.connect('mongodb://madhavank:thulasi12@ec2-52-86-219-237.compute-1.amazonaws.com:27017/movieDB');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser());

//define model
var movieStat = mongoose.model('movieStat', {movie: String});

app.get('/', function(req, res) {
    // The form's action is '/' and its method is 'POST',
    // so the `app.post('/', ...` route will receive the
    // result of our form
    var html = '<form action="/" method="post">' +
        'Enter random number or search a movie name:' +
        '<input type="text" name="movieName" placeholder="..." />' +
        '<br>' +
        '<button type="submit">Submit</button>' +
        '</form>';

    res.send(html);
});

app.post('/', function(req, res) {

    //this could be a number or a name, so validate
	var movieName = req.body.movieName;
	
    var isNumber = 0;
    if (isNaN(movieName)) {
        url = 'http://www.imdb.com/find?q=' + movieName + '&s=tt';
		
		var movieToInsert = new movieStat({movie: movieName});
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
                tdtotal += ($(this).html()) + '.<br>';
            });

            

        }


        if (isNumber == 1) {
            var html = '<a href="/">Try again.</a>'+'<br>'+'<a href="/search">Stats.</a>'+'<br>'+'Movie: ' + title + '.<br>' + 'Release: ' + release + '.<br>' + 'Rating: ' + rating + '.<br>' + '.<br>' + tdtotal;
                
        } else {
            var html = '<a href="/">Try again.</a>'+'<br>'+'<a href="/search">Stats.</a>'+ '.<br>'+tdtotal ;
                
        }

        res.send(html);

    })
})
app.get('/collections',function(req,res){
  db.driver.collectionNames(function(e,names){
    res.json(names);
  })
});
app.get('/search',function(req,res){
 
  movieStat.find({}, function (err, userObj) {
  if (err) {
    console.log(err);
  } else if (userObj) {
    console.log('Found:', userObj);
	res.json(userObj);
  }
})
});





app.listen('8081')
console.log('Listening on port 8081');
exports = module.exports = app;
