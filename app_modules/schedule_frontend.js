var schedule_fe = {
  start : function() {
    var sys = require('sys'),
        fs = require('fs'),
        url = require('url'),
        http = require('http'),
        mustache = require('mustache'),
        _ = require('underscore'),
        restify = require('restify');
      
    var that = this;
    that.process = this.process;
    
    var client = restify.createClient({
      url: 'http://127.0.0.1:1338',
      version: '>=1.2.3',
      path: '/api',
    });
    /*
    var actions = [];

    actions.push({
      path: "/",
      template: "index.html",
      view: {
        title: "Scheduler"
      }
    });

    actions.push({
      path: "/js",
      route: "/js"
    });

    actions.push({
      path: "/css",
      route: "/css"
    });
    */

    var serverInit = function (req, res) {
      req.addListener('end', function() {
        //console.log(req.url);
        var pathName = url.parse(req.url).pathname;
        switch(pathName) {
          case '/':
            fs.readFile("./templates/index.html", 'utf8', function(err, template) {
              if(err) throw err;
              res.writeHead(200, {'Content-Type': 'text/html'});
              res.write(mustache.to_html(template, { title: "Scheduler" }));
              res.end();
            });
            break;
          case '/js/fullcalendar.js':
          case '/js/jquery-1.5.2.min.js':        
          case '/js/jquery-ui-1.8.11.custom.min.js':
          case '/css/fullcalendar.css':
          case '/css/fullcalendar.print.css':
          case '/css/global.css':
            fs.readFile("." + pathName, 'utf8', function(err, template) {
              if(err) throw err;
              if(pathName.match(/^\/js\//)) {
                res.writeHead(200, {'Content-Type': 'text/javascript'});
              } else if(pathName.match(/^\/css\//)) {
                res.writeHead(200, {'Content-Type': 'text/css'});
              }
              res.write(template);
              res.end();
            });
            break;
          default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write("Error");
            res.end();
            break;
        }
    
        /*
        var action = _(actions).chain().select(function(a) { return url.parse(req.url).pathname == a.path; }).first().value();
    
        if (_.isEmpty(action)) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write("Error");
          res.end();
        } else {
          fs.readFile("./templates/" + action.template, 'utf-8', function(err, template) {
            if(err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(mustache.to_html(template, action.view));
            res.end();
          });
        }
        */
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