var express = require('express'),
    request = require('request'),
    http = require('http'),
    app = express(),
    fs = require('fs'),
    async = require('async');

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
app.use('/data', express.static(__dirname + '/data'));

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
    });
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
            res.status(200).json([body.substring(preIndex, searchIndex + 6)]);
        }
    });
});

app.get('/api/getSearchData', function (req, res) {
    fs.readFile(__dirname + '/data/data.txt', 'utf8', function (err, data) {
        if (err) {
            console.log(err);
            res.status(500).json([err]);
        }
        else {
            //console.log(data);
            res.status(200).json([data]);
        }
    });
});

app.get('/api/renewData', function (req, res) {
    console.log("Renew data")
    res.status(200).json(["OK"]);
    getDataMangaK(function (err) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Done renew");
        }
    });
});
app.listen(process.env.PORT || 3000, function () {
    console.log('Listening at http://localhost:3000/')
});

function getDataMangaK(callback) {
    function getPosition(str, m, i) {
        return str.split(m, i).join(m).length;
    }
    function getPositionAfterIndex(string, str, i) {
        return string.substring(i).indexOf(str);
    }
    function getContentInQuote(string, str) {
        var tmp = string.substring(string.indexOf(str));
        return tmp.substring(getPosition(tmp, '"', 1) + 1, getPosition(tmp, '"', 2));
    }
    function convertSomeHTMLEntities(input) {
        return input.replace('&#8211;', '-').replace('&#8211;', '-').replace('&#8230;', '...').replace('&#8217;', '\'').replace('&#8217;', '\'').replace('&#038;', '&').replace('&#8220;', '"').replace('&#8221;', '"').replace('&#215;', 'x');
    }
    var listManga = [];
    var listTask = [];
    var finished = 0;
    var getData = function (page, cb) {
        var url = "http://mangak.info/page/" + page + "/?s&q";
        request({
            url: url,
            json: true
        }, function (error, response, body) {
            if (error) {
                console.log(error);
            }
            if (!error && response.statusCode === 200) {
                html = body.substring(body.indexOf('<div class="update_item">'), body.indexOf("<div class='wp-pagenavi'>") - 1);
                while (html.indexOf('<div class="update_item">') >= 0) {
                    var htmlManga = html.substring(0, getPosition(html, '<div class="update_item">', 2));

                    var manga = {
                        title: convertSomeHTMLEntities(getContentInQuote(htmlManga, 'title')),
                        img: getContentInQuote(htmlManga, 'src'),
                        link: getContentInQuote(htmlManga, 'href')
                    }
                    html = html.substring(getPosition(html, '<div class="update_item">', 2))
                    if (listManga.length == 0) {
                        listManga.push(manga);
                    }
                    for (var index in listManga) {
                        if (listManga[index].title == manga.title && listManga[index].img == manga.img && listManga[index].link == manga.link)
                            break;
                        if (index == listManga.length - 1) {
                            listManga.push(manga);
                        }
                    }
                }
                finished++;
                console.log("Get data process: " + finished + "/132 for page: " + page + " listManga.length: " + listManga.length);
            }
            cb(null, page);
        });
    }

    function getDataFromToPage(from, to, total) {
        for (var i = from; i <= to && i <= total; i++) {
            listTask.push(getData.bind(null, i));
        }

        async.parallel(listTask, function (error, results) {
            if (to >= total) {
                writeDataToFile(listManga, callback);
            }
            else {
                listTask = [];
                setTimeout(function () { getDataFromToPage(from + 19, to + 19, total); }, 7000);
            }
        });
    }
    getDataFromToPage(1, 19, 132);
}

function writeDataToFile(arrayData, callback) {
    var file = fs.createWriteStream(__dirname + '/data/data.txt');
    file.on('error', function (err) {
        console.log(err);
        callback(err);
    });
    file.write('[');
    arrayData.forEach(function (value, index) {
        file.write(JSON.stringify(value) + ((index == arrayData.length - 1) ? '' : ','));
    });
    file.write(']');
    file.end();
    callback(null);
}