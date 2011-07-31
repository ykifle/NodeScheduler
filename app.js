require.paths.unshift(__dirname + '/app_modules');
var schedule_fe = require('schedule_frontend'),
    schedule_be = require('schedule_backend');
    
schedule_be.start();
schedule_fe.start();