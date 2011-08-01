var schedule_fe = {
  start : function() {
    var sys = require('sys'),
        fs = require('fs'),
        url = require('url'),
        http = require('http'),
        mustache = require('mustache'),
        _ = require('underscore'),
        restify = require('restify'),
        mime = require('mime'),
        querystring = require('querystring'),
        req = http.IncomingMessage.prototype,
        res = http.ServerResponse.prototype;
    
    var that = this;
    that.process = this.process;
    
    req.header = function(name, defaultValue){
      switch (name = name.toLowerCase()) {
        case 'referer':
        case 'referrer':
          return this.headers.referrer
            || this.headers.referer
            || defaultValue;
        default:
          return this.headers[name] || defaultValue;
      }
    };
    
    req.accepts = function(type){
      var accept = this.header('Accept')
        , type = String(type);

      // when not present or "*/*" accept anything
      if (!accept || '*/*' == accept) return true;

      // normalize extensions ".json" -> "json"
      if ('.' == type[0]) type = type.substr(1);

      // allow "html" vs "text/html" etc
      if (!~type.indexOf('/')) type = mime.lookup(type);

      // check if we have a direct match
      if (~accept.indexOf(type)) return true;

      // check if we have type/*
      type = type.split('/')[0] + '/*';
      return !! ~accept.indexOf(type);
    };
    
    res.req = null;
    res.header = function(name, val){
      if (1 == arguments.length) {
        return this.getHeader(name);
      } else {
        this.setHeader(name, val);
        return this;
      }
    };
    res.redirect = function(url, status){
      var app = {
        that: this,
        set: function(key, value) {
          if(value) {
            that[key] = value; 
          }
          return that[key];
        }
      };
      
      var req = this.req
        , base = app.set('home') || '/'
        , status = status || 302
        , body;

      // Setup redirect map
      var map = {
          back: req.header('Referrer', base)
        , home: base
      };

      // Support custom redirect map
      map.__proto__ = app.redirects;

      // Attempt mapped redirect
      var mapped = 'function' == typeof map[url]
        ? map[url](req, this)
        : map[url];

      // Perform redirect
      url = mapped || url;

      // Relative
      if (!~url.indexOf('://')) {
        // Respect mount-point
        if (app.route) url = join(app.route, url);

        // Absolute
        var host = req.headers.host
          , tls = req.connection.encrypted;
        url = 'http' + (tls ? 's' : '') + '://' + host + url;
      }

      // Support text/{plain,html} by default
      if (req.accepts('html')) {
        body = '<p>' + status + '. Redirecting to <a href="' + url + '">' + url + '</a></p>';
        this.header('Content-Type', 'text/html');
      } else {
        body = status + '. Redirecting to ' + url;
        this.header('Content-Type', 'text/plain');
      }

      // Respond
      this.statusCode = status;
      this.header('Location', url);
      this.end(body);
    };
    
    var client = restify.createClient({
      url: 'http://127.0.0.1:1338',
      version: '>=1.2.3',
      path: '/api'
    });

    var sendFile = function(res, fileName, viewParams, isTemplate) {
      var mimeType = isTemplate ? 'text/html' : (mime.lookup(fileName) || 'text/plain');
      fs.readFile(fileName, isTemplate ? 'utf8' : mime.charsets.lookup(mimeType), function(err, file) {
        if(err) {
          console.log('File not found: ' + fileName);
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write("File not found");
          res.end();
          return;
        };
        res.writeHead(200, {'Content-Type': mimeType});
        res.write(isTemplate ? mustache.to_html(file, viewParams) : file);
        res.end();
      });
    };
    
    var schedule_action = function(req_data, res) {
      // Do stuf with schedule data
      //console.log(req_data);
      validate_create(req_data, function(form_errors) {
        if(_.keys(form_errors).length > 0) {
          handle_error(form_errors);
        } else {
          create_event(req_data, function() {
            // Redirect to home page
            res.redirect('http://localhost:1337/');
          });
        }
      });
    };
    
    var validate_create = function(data, callback) {
      var form_errors = {};
      // Check for errors
      callback(form_errors);
    };
    
    var create_event = function(data, callback) {
      //Make API call to create event
      var request = {
        path: '/events',
        body: data
      };
      client.post(request, function(err, body, headers) {
        if(err) {
          console.log('Error creating event: ' + err);
          handle_errors({ 'create_event': false });
        } else {
          callback();
        }
      });
    };
    
    var handle_errors = function(form_errors) {
      sendFile(res, './templates/create.html', _.extend({ title: "Create Schedule" }, form_errors), true);
    };
    
    var serverInit = function (req, res) {
      res.req = req;
      var content = '';
      req.addListener('data', function(chunk) {
        content += chunk;
      });
      
      req.addListener('end', function() {
        //console.log(req.url);
        var url_info = url.parse(req.url);
        switch(url_info.pathname) {
          case '/':
          case '/index.html':
            sendFile(res, './templates/index.html', { title: "Scheduler" }, true);
            break;
          case '/create.html':
            sendFile(res, './templates/create.html', { title: "Create Schedule" }, true);
            break;
          case '/schedule_action':
            schedule_action(querystring.parse(content), res);
            break;
          default:
            sendFile(res, '.' + url_info.pathname, {}, false);
            break;
        }
      }); 
    };
    
    var server = http.createServer(serverInit).listen(1337, "127.0.0.1", function() {
      console.log('Server running at http://127.0.0.1:1337/');
    });

    process.on('uncaughtException', function(err) {
      console.error('Exception: ' + err);
    });
    
  }
};

module.exports = schedule_fe;