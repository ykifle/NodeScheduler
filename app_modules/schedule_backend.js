var schedule_be = {
  start : function() {
    var restify = require('restify'),
        mongo = require('mongodb');

    var db = new mongo.Db('schedule_db', new mongo.Server('127.0.0.1', 27017, {}));
    var server = restify.createServer();
    
    var getEvents = function(start, end) {
      var events = [];
      db.open(function(err, p_db) {
        if(err) {
          console.log('Error opening database schedule_db: ' + err);
          return;
        }
        var start_date = new Date(start * 1000);
        var end_date = new Date(end * 1000);
        db.collection('events', function(err, collection) {
          if(err) {
            console.log('Error opening collection events:' + err);
            return;
          }
          var query = {
            $or: [ { $and: [ { 'start': { $lte: start_date } }, { 'end': { $gt: start_date } } ] }, { $and: [ { 'start': { $gt: start_date } }, { 'start': { $lt: end_date } } ] } ]
          };
          events = events.concat(collection.find(query).toArray());
        });/*
        db.collection('rep_events', function(err, collection) {
          if(err) {
            console.log(err);
          }
          var query = {
            $or: [ { $and: [ { 'start': { $lte: start_date } }, { 'end': { $gt: start_date } } ] }, { $and: [ { 'start': { $gt: start_date } }, { 'start': { $lt: end_date } } ] } ]
          };
          events = events.concat(collection.find(query).toArray()); 
        });*/
      });

      return events; 
    };
    
    server.get('/api/events', function(req, res) {
      console.log('Request params = ' + JSON.stringify(req.params, null, 4));
      console.log('Request uriParams = ' + JSON.stringify(req.uriParams, null, 4));
      console.log('Recived request for events in range start = ' + req.params.start + ' end = ' + req.params.end);
      res.send(200, getEvents(req.params.start, req.params.end)
      );
    });
    
    server.get('/api/events/jsonp', function(req, res) {
      console.log('Request params = ' + JSON.stringify(req.params, null, 4));
      console.log('Request uriParams = ' + JSON.stringify(req.uriParams, null, 4));
      console.log('Recived request for events in range start = ' + req.params.start + ' end = ' + req.params.end);
      var date = new Date();
      res.send(
        {
          code: 200,
          headers: {
            'Content-Type': 'text/javascript'
          },
          noEnd: true
        });
      
      res.write(req.params.callback + '([{ title: "An Event",start: ' + new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) + ' }]);');
      //res.write('[{ title: "An Event",start: ' + new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) + ' }]');
      res.end();
    });
    
    server.listen(1338);
    
    process.on('uncaughtException', function(err) {
      console.error('BE Exception: ' + err);
    });
    
  }
};

module.exports = schedule_be;