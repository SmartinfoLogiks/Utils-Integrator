/*
 * Logging functions
 * Create A Logger, may be we will remove this in future
 * LEVELS : trace,debug,info,warn,error,fatal
 * 
 * Usage:
 * _log("TESTING", this._PLUGINNAME, "warn");
 * 		OR
 * LOGGER.log("TESTING", this._PLUGINNAME);
 * 
 * */

const bunyan = require('bunyan');
const RotatingFileStream = require('bunyan-rotating-file-stream');
const ringbuffer = new bunyan.RingBuffer({ limit: 100 });

const LOGGERS = {};

module.exports = {
    
    initialize: function() {
    	var that = this;

    	if(!fs.existsSync('./logs/')) {
            fs.mkdirSync('./logs/');
        }

		// _.each(CONFIG.LOGGER, function(logParams, logKey) {
		// 	// console.log(logKey, logParams);

		// 	LOGGERS[logKey] = bunyan.createLogger({
		// 		    name: logKey.toUpperCase(),
		// 		    streams: logParams
		// 		});
		// });

		LOGGERS['default'] = bunyan.createLogger({
			name: "Automator",
			streams: [
				{
					level: 'info',
					path: './logs/info.log',
				},
				// {
				// 	level: 'debug',
				// 	stream: process.stdout
				// },
				{
					level: 'error',
					stream: new RotatingFileStream({
						path: './logs/error.log',
						period: '1d',          // daily rotation
						totalFiles: 10,        // keep up to 10 back copies
						rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
						threshold: '10m',      // Rotate log files larger than 10 megabytes
						totalSize: '20m',      // Don't keep more than 20mb of archived log files
						gzip: true             // Compress the archive log files to save space
					})
				},
				{
		            level: 'trace',
		            type: 'raw',    // use 'raw' to get raw log record objects
		            stream: ringbuffer
		        }
			]
		});

		if(LOGGERS['default']!=null) global.logger = LOGGERS['default'];

		global._log = that.log;

		console.log("LOGGER Initialized");
    },

    //Initiate Per Plugin Loggers
    initMyLogger: function(logkey, logLevel) {
    	if(logkey==null) return false;
    	if(logLevel==null) logLevel = "info";
    	
    	var logParams = [];

    	logkey = logkey.toLowerCase();
    	logParams.push({
					level: logLevel,
					path: `./logs/${logkey}.log`,
				});

    	LOGGERS[logkey] = bunyan.createLogger({
    		name: logkey,
    		streams: logParams
    	});

    	console.log(" > LOGGERS Initialized", logkey);
    },

    logKeys: function() {
		return Object.keys(LOGGERS);
	},

    log: function(logObj, logKey, logLevel) {
    	if(logKey==null) logKey = "default";
		if(logLevel==null) logLevel = "info";

		logKey = logKey.toLowerCase();

		logObj.level_name = logLevel;

		if(LOGGERS[logKey]==null) logControl = LOGGERS["default"];
		else logControl = LOGGERS[logKey];

		//console.info("LOGGER", logKey, logObj, logLevel, logControl);

		if(logControl) {
			switch(logLevel) {
				case "trace":
					logControl.trace(logObj);
				break;
				case "debug":
					logControl.debug(logObj);
				break;
				case "info":
					logControl.info(logObj);
				break;
				case "warn":
					logControl.warn(logObj);
				break;
				case "error":
					logControl.error(logObj);
				break;
				case "fatal":
					logControl.fatal(logObj);
				break;

			}
		} else {
			console.log("LOGGER KEY MISSING", logKey);
		}
	},
}