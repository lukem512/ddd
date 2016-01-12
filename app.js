var express = require('express'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    api = require('./api'),
    http = require('http');

var app = module.exports = express();

app.set('port', process.env.PORT || 80);
app.use(morgan('dev'));
app.use(methodOverride());

app.get('/api/all', api.all);
app.get('/api/words/all', api.words);
app.get('/api/words/:length', api.words);
app.get('/api/pronouncable', api.pronouncable);

// Default route.
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/results.html');
});

// The 404 route.
// KEEP THIS AS THE LAST ROUTE
app.get('*', function(req, res) {
    res.status(404);

    if (req.accepts('html')) {
        res.send('<html><head><title>Error 404</title></head><body><p>Not found</p></html>');
        return;
    }

    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    res.type('txt').send('Not found');
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
