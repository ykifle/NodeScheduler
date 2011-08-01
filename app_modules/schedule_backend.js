var schedule_be = {
  start : function() {
    var restify = require('restify'),
        mongoose = require('mongoose'),
        Schema = mongoose.Schema;

    var isObject = function(obj) {
      return (null !== obj && 'object' == typeof(obj));
    };
    var printObject = function(obj, maxDepth) {
      var s = '';
      s = recPrintObject(obj, 0, 0, maxDepth, s);
      /*
      if(isObject(obj)) {
        s = s + "{\n";
        for(key in obj) {
          s = s + '  ' + key + ': ' + obj[key] + ',\n';
        }
        s = s + "},\n";
      } else {
        s = s + (obj) ? obj : 'undefined';
      }
      */
      return s;
    };
    var recPrintObject = function(obj, indent, depth, maxDepth, s) {
      var spaces = '';
      for(var i=0; i<indent; i++) spaces = spaces + ' ';
      console.log('depth = ' + depth);
      if((depth <= maxDepth) && isObject(obj)) {
        s = s + "{\n";
        console.log('s = ' + s.toString());
        for(key in obj) {
          s = s + spaces + '  ' + key + ': ';
          console.log('s = ' + s);
          s = recPrintObject(obj[key], indent + 4 + key.length, ++depth, s);
          console.log('s = ' + s);
        }
        s = s + spaces + "},\n";
        console.log('s = ' + s);
      } else {
        s = s + (obj) ? obj : 'undefined';
        s = s + ',\n';
        console.log('s = ' + s);
      }
      return s;
    };
    
    var server = restify.createServer();
    mongoose.connect('mongodb://localhost/schedule_db');
    if(!mongoose.connection) {
      console.log('Failed to connect to mongoose db');
    }
    
    var EventSchema = new Schema({
      id : { type: Number },
      title: { type: String, default: 'New Event', required: true },
      description: { type: String, default: '' },
      start: { type: Date, default: Date.now, required: true },
      startDay: { type: Number, min: 0, max: 6 },
      end: { type: Date, default: Date.now },
      endDay: { type: Number, min: 0, max: 6 },
    });
    
    var RepeatingEventSchema = new Schema({
      untill: { type: Date },
      period: { type: Number, min: 0, required: true },
      eventInfo: { type: [EventSchema], required: true }
    });
    
    var Event = mongoose.model('Event', EventSchema);
    var ReEvent = mongoose.model('ReEvent', RepeatingEventSchema);
    /*
    var date = new Date();
    var event = new Event({
      title: 'My new event',
      description: 'This is my new event',
      start: date,
      end: new Date(date.getTime() + (24 * 60 * 60 * 1000))
    });
    
    event.save(function(err){
      if (err) { console.log('Error saving event: ' + err); throw err; }
      else { console.log('Event has been saved'); }
    });
    
    Event.find({}, function(err, docs) {
      if (err) { 
        console.log('Error finding events: ' + err);
        throw err;
      }
      
      console.log('Found events: ' + docs);
      docs.forEach(function(doc) { 
        console.log(doc); 
      });
    });
    */
    var getEvents = function(start, end, callback) {
      var eventList = [];
      var start_date = new Date(start * 1000);
      var end_date = new Date(end * 1000);
      console.log('Searching for events between ' + start_date + ' and ' + end_date);
      var eventQuery = {
        $or: [ { start: { $lte: start_date }, 
                 end: { $gt: start_date } }, 
               { start: { $gt: start_date }, 
                 start: { $lt: end_date } } ]
      };
      Event.find(eventQuery, function(err, events) {
        events.forEach(function(event) {
          //console.log(event);
          eventList.push(event);
        });
        callback(eventList);
      });
      return true; 
    };
    
    server.get('/api/events', function(req, res) {
      //console.log('Request params = ' + JSON.stringify(req.params, null, 4));
      //console.log('Request uriParams = ' + JSON.stringify(req.uriParams, null, 4));
      console.log('Recived request for events in range start = ' + req.params.start + ' end = ' + req.params.end);
      getEvents(req.params.start, req.params.end, function(events) {
        //console.log('Found events: ' + printObject(events, 2));
        res.send(200, events);
      });
    });
    
    server.get('/api/events/jsonp', function(req, res) {
      //console.log('Request params = ' + JSON.stringify(req.params, null, 4));
      //console.log('Request uriParams = ' + JSON.stringify(req.uriParams, null, 4));
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
      
      getEvents(req.params.start, req.params.end, function(events) {
        res.write(req.params.callback + '(' + events + ');');
        res.end();
      });
    });
    
    server.post('/api/events', function(req, res) {
      var event = new Event({
        title: req.params.name,
        description: req.params.description,
        start: req.params.startDate,
        end: req.params.endDate
      });
      event.save(function(err){
        if (err) { 
          console.log('Error saving event: ' + err);
          res.send(400, { 'error': err });
        } else { 
          console.log('Event has been saved');
          res.send(200); 
        }
      });
    });
    
    server.listen(1338);
    
    process.on('uncaughtException', function(err) {
      console.error('BE Exception: ' + err);
    });
    
  }
};

module.exports = schedule_be;