//Main file for starting and controlling the Integrator Utility Functions

require('dotenv').config();

global.moment = require('moment');
global._ = require('lodash');
global.axios = require('axios');//.default;
global.glob = require('glob');
global.fs = require('fs');
global.path = require('path');
global.md5 = require('md5');

const express = require('express')
const cron = require('node-cron');
const {nanoid} = import("nanoid");

const LOADED_PLUGINS = {};
const ACTIVE_TASKS = {};

console.log("\x1b[34m%s\x1b[0m","\nIntegrator Initialization Started @ "+moment().format(),"\n");

process.env.START_TIME = moment().format();
process.env.ROOT_PATH  = __dirname;

//Initialize Plugins
fs.readdirSync('./plugins/').forEach(function(file) {
        if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
        	var className = file.toLowerCase().replace(".js", "").toUpperCase();
            var filePath = path.resolve('./plugins/' + file);

            LOADED_PLUGINS[className] = require(filePath);
            // console.log(">>>", className, filePath, LOADED_PLUGINS);

            if(LOADED_PLUGINS[className].initialize!=null) {
                LOADED_PLUGINS[className].initialize();
            }
        }
    });

//Initialize Schedullers
const CONFIG = require('./config');
if(CONFIG==null) {
	console.log("\x1b[31m%s\x1b[0m","\nIntegrator Configuration Not Found");
	process.exit(0);
}

_.each(CONFIG.TASKS, function(conf, k) {
	if(LOADED_PLUGINS[conf.plugin.toUpperCase()]==null) {
		console.log("\x1b[31m%s\x1b[0m","\nIntegrator Not Supported for Plugin -",conf.plugin);
		return;
	}
	if(LOADED_PLUGINS[conf.plugin.toUpperCase()].runTask==null) return;//Not a job type of plugin
	
	if(conf.params==null) conf.params = {};
	
	if(conf.schedule!=null && conf.schedule.length>0) {
		const job = cron.schedule(conf.schedule, () => {
				runIntegratorTask(k, conf, conf.params);
			});
		ACTIVE_TASKS[k.toUpperCase()] = {
			"opts": conf,
			"job": job,
			"runner": LOADED_PLUGINS[conf.plugin.toUpperCase()],
			"started": moment().format(),
			"status": "active",
		};
	} else {
		ACTIVE_TASKS[k.toUpperCase()] = {
			"opts": conf,
			"job": false,
			"runner": LOADED_PLUGINS[conf.plugin.toUpperCase()],
			"started": moment().format(),
			"status": "inactive",
		};
	}
})

//Process Cleanup
function exitHandler(options, exitCode) {
    if(options=="exit") return;
    console.log("\n\x1b[34m%s\x1b[0m","Integrator Shutting Down @ "+moment().format());
	process.exit(0);
}

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, exitHandler.bind(null, eventType));
})

process.on('uncaughtException', function(err) {
    console.error(err.name,err.message,err.stack);
});

//Hook Server Setup
if(process.env.HOOK_PORT==null) {
	console.log("\n\x1b[31m%s\x1b[0m","Integrator Hook Sever Failed as ENV PORT not set ");

	console.log("\n\x1b[34m%s\x1b[0m","Integrator Initialization Completed @ "+moment().format());
} else {
	const app = express();
	app.use(express.json());

	app.use(function(req, res, next) {
		if(process.env.HOOK_KEY && process.env.HOOK_KEY.length>0) {
			if(req.headers.authorization==null) {
				res.status(401).send(`Authorization Missing`);
				return;
			}
			const authKey = req.headers.authorization.split(" ");
			if(authKey[1]==null || authKey[1]!=process.env.HOOK_KEY) {
				res.status(401).send(`Authorization Key Mismatch`);
				return;
			}
		}
		return next();
	});

	app.get('/', (req, res, next) => {
	  res.send('Welcome to Integrator Server');
	  return next();
	});

	if(process.env.ALLOW_GET_HOOKS) {
		app.get('/hook/:hookid', (req, res, next) => {
			const HOOKID = req.params.hookid.toUpperCase();

			if(ACTIVE_TASKS[HOOKID]==null) {
				res.status(404).send(`Requested hook not found or not loaded`);
		  		return next();
			} else {
				runIntegratorTask(HOOKID, ACTIVE_TASKS[HOOKID].opts, _.extend({}, req.body, ACTIVE_TASKS[HOOKID].opts.params), function(responseData, errorMessage, interimObject) {
					if(responseData) {
						res.send({
							"status": "success",
							"data": responseData
						});
					} else {
						res.send({
							"status": "error",
							"msg": errorMessage,
							"interim": interimObject
						});
					}
					return next();
				});
			}
		});
	}

	app.post('/hook/:hookid', (req, res, next) => {
		const HOOKID = req.params.hookid.toUpperCase();

		if(ACTIVE_TASKS[HOOKID]==null) {
			res.status(404).send(`Requested hook not found or not loaded`);
	  		return next();
		} else {
			runIntegratorTask(HOOKID, ACTIVE_TASKS[HOOKID].opts, _.extend({}, req.body, ACTIVE_TASKS[HOOKID].opts.params), function(responseData, errorMessage, interimObject) {
				if(responseData) {
					res.send({
						"status": "success",
						"data": responseData
					});
				} else {
					res.send({
						"status": "error",
						"msg": errorMessage,
						"interim": interimObject
					});
				}
				return next();
			});
		}
	});

	app.listen(process.env.HOOK_PORT, () => {
	  console.log("\n\x1b[34m%s\x1b[0m",`Integrator Hook Server Started @ `+moment().format()+` and can be accessed on http://localhost:${process.env.HOOK_PORT}/`);

	  console.log("\n\x1b[34m%s\x1b[0m","Integrator Initialization Completed @ "+moment().format());
	})
}


//Integrator Task Runner Function
//Is a recursive itreation function which finds and executes the pipeline tasks
function runIntegratorTask(k, conf, params, callback) {
	LOADED_PLUGINS[conf.plugin.toUpperCase()].runTask(params, function(responseData) {
		if(conf.transform!=null) {
			if(LOADED_PLUGINS[conf.transform.toUpperCase()].transform!=null) {
				LOADED_PLUGINS[conf.transform.toUpperCase()].transform(responseData, function(transformResponse) {
					if(conf.pipe!=null) {
						if(ACTIVE_TASKS[conf.pipe.toUpperCase()]!=null && ACTIVE_TASKS[conf.pipe.toUpperCase()].runner!=null) {
							runIntegratorTask(conf.pipe, ACTIVE_TASKS[conf.pipe.toUpperCase()].opts, _.extend({}, ACTIVE_TASKS[conf.pipe.toUpperCase()].opts.params, transformResponse), callback);
						} else if(LOADED_PLUGINS[conf.pipe.toUpperCase()]!=null && LOADED_PLUGINS[conf.pipe.toUpperCase()].runTask!=null) {
							LOADED_PLUGINS[conf.pipe.toUpperCase()].runTask(transformResponse, function(pipeResponse) {
								console.log("\x1b[33m%s\x1b[0m",`Task- ${k} Completed @ `+moment().format(), pipeResponse);
								if(callback!=null && typeof callback=="function") callback(pipeResponse);
							});
						} else {
							console.log("\x1b[31m%s\x1b[0m",`\nTask Pipe - ${conf.pipe} for Task- ${k} Not Found`);
							if(callback!=null && typeof callback=="function") callback(false, `Task Pipe - ${conf.pipe} for Task- ${k} Not Found`, transformResponse);
						}
					} else {
						console.log("\x1b[33m%s\x1b[0m",`Task- ${k} Completed @ `+moment().format(), transformResponse);
						if(callback!=null && typeof callback=="function") callback(transformResponse);
					}
				});
			} else {
				console.log("\x1b[31m%s\x1b[0m",`\nTransformer - ${conf.transform} for Task- ${k} Not Found`);
				if(callback!=null && typeof callback=="function") callback(false, `Transformer - ${conf.transform} for Task- ${k} Not Found`, responseData);
			}
		} else {
			console.log("\x1b[33m%s\x1b[0m",`Task- ${k} Completed @ `+moment().format(), responseData);
			if(callback!=null && typeof callback=="function") callback(responseData);
		}
	});
}