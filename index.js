var express = require('express'),
    request = require('request'),
    http = require('http'),
    app = express()

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/home.html');
});
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
    next();
});
app.use('/js', express.static(__dirname + '/js'));
app.use('/views', express.static(__dirname + '/views'));

app.get('/api/getNewManga', function (req, res) {
    var url = "http://mangak.info/"

    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            console.log(error);
        }
        if (!error && response.statusCode === 200) {
            res.json([body.substring(body.indexOf('<div class="wrap_update home">'), body.indexOf('<!-- tab moi cap nhat -->')).replace(/<br>/g, "")]);
        }
    })

});

app.get('/api/getChapters/:link', function (req, res) {
    var url = "http://mangak.info/" + req.params.link
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            console.log(error);
        }
        if (!error && response.statusCode === 200) {
            res.status(200).json([body.substring(body.indexOf('<div class="chapter-list">'), body.indexOf("jQuery(document).ready(function($)") - 20)]);
        }
    })
});

app.get('/api/getChapterContent/:link', function (req, res) {
    var url = "http://mangak.info/" + req.params.link
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            console.log(error);
        }
        if (!error && response.statusCode === 200) {
            preString = '<div class="vung_doc">';
            searchString = "</div>";
            preIndex = body.indexOf(preString);
            searchIndex = preIndex + body.substring(preIndex).indexOf(searchString);
            res.status(200).json([body.substring(preIndex, searchIndex+6)]);
        }
    })
});
app.listen(process.env.PORT || 3000, function () {
    console.log('Listening at http://localhost:3000/')
});