var fs         = require('fs'),
    https      = require('https'),
    express    = require('express'),
    bodyParser = require('body-parser'),
    request    = require('request'),
    session    = require('client-sessions'),
    app        = express();

//------------------------------------------------------------------------
// HTTPS SERVER CONFIGURATIONS
//------------------------------------------------------------------------

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
    }, app).listen(4430, function() {
        console.log('Listening on port 4430');
    });

app.use(session({
    cookieName: 'session',
    secret: '1234sdfljnpfvnodvnsdjonsdorinv',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

app.use(function(req, res, next) {
    if (0 == 0) {
        console.log('session', req.session);
        res.send(req.body)
        next();
    } else {
        return res.redirect('https://localhost:3001/#/login');
        //next();
    }
    
    
});

app.use(bodyParser.json());
app.use(express.static("public"));

//------------------------------------------------------------------------
// HTTPS ROUTE CONFIGURATIONS
//------------------------------------------------------------------------

app.post('/login', function(req, res) {
    if (0 == 0) {
        req.session.user = req.body;
        res.send(req.body);
    }
    //
})

app.get('/catbird', function(req, res) {
    request('http://35.165.75.166/api/1/dashboard/', function(err, response, body) {
        console.log('catbird server response', body);
        res.send(body);
    })
})

app.get('/users', function (req, res) {
    //---------REMOVE THIS WHEN GOING LIVE - SECURITY ISSUE -------------//
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    //-------------------------------------------------------------------//
    request('https://54.71.30.235/api/test', function(err, response, body) {
        console.log('heres the response:', body);
        res.end(body);
    })
});

app.post('/users', function(req, res) {
    console.log('sending request', req.body);
})



//------------------------------------------------------------------------
// HTTP SERVER CONFIGURATIONS
//------------------------------------------------------------------------

var express = require("express");
var app = express();

app.listen(3000, function() {
    console.log('Listening on port 3000');
});

app.use(express.static("public"));

app.post('/users', function(req, res) {
    console.log('sending request', req.body);
})

app.get('/catbird', function(req, res) {
    request('http://35.165.75.166/api/1/dashboard/', function(err, response, body) {
        console.log('catbird server response', body);
        res.send(body);
    })
})