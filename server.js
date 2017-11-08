// server.js
// where your node app starts

// init
// setup express for handling http requests
var express = require("express");
var app = express();
var bodyParser = require('body-parser');

const GoogleImages = require('google-images');

const client = new GoogleImages(process.env.CX, process.env.API_KEY);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public')); // http://expressjs.com/en/starter/static-files.html
var connected=false;
app.listen(3000);
console.log('Listening on port 3000');
    
// setup nunjucks for templating in views/index.html
var nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: true, express: app });

// setup our datastore
var datastore = require("./datastore").sync;
datastore.initializeApp(app);

// create routes
app.get("/", function (request, response) {
  try {
    initializeDatastoreOnProjectCreation();
    var posts = datastore.get("posts");
    response.render('index.html', {
      title: "Image Search Abstraction Layer",
      posts: posts.reverse()
    });
  } catch (err) {
    console.log("Error: " + err);
    handleError(err, response);
  }
});


app.get('/latest',
        (req, res) => {
          let img = datastore.get("img");
          
          let ans = {};
          
          ans = img.sort( (a, b) => b.timestamp - a.timestamp ).filter((a, i) => i < 10);
          
          res.status(200).json(ans);
        }
);


app.get('/search/:query', (req, res) => {
  let query = req.params.query,
      timestamp = Date.now();
  let img = datastore.get("img");
  
  img.push({query, timestamp});
  
  datastore.set("img", img);
  
  client.search(query)
        .then(images => res.json(images));
});



function handleError(err, response) {
  response.status(500);
  response.send(
    "<html><head><title>Internal Server Error!</title></head><body><pre>"
    + JSON.stringify(err, null, 2) + "</pre></body></pre>"
  );
}

// ------------------------
// DATASTORE INITIALIZATION

function initializeDatastoreOnProjectCreation() {
  if(!connected){
    connected = datastore.connect();
  }
  if (!datastore.get("initialized")) {
    datastore.set("urls", []);
    datastore.set("img", []);
    datastore.set("initialized", true);
  }  
}