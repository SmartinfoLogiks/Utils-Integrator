//All CACHE functions available to system

const ioredis = require("ioredis");
var redis = null;
var LOCAL_CACHE = {};//VOLATILE
var LOCAL_CACHE_HASH = false;//Local Cache HASH

var CACHE_TYPE = "local";
var CACHE_SYNC_PERIOD = 5000;//5 secs

/*
 * Cache Storage Controls all the Caching Functionality. It helps speed up fetching various cached data directly
 * using indexes. This is important as REDIS Cache forms the core to our speed.
 * */
module.exports = {

    initialize: function() {
        if(process.env.CACHE_TYPE!=null) CACHE_TYPE = process.env.CACHE_TYPE;
        if(process.env.CACHE_SYNC_PERIOD!=null) CACHE_SYNC_PERIOD = process.env.CACHE_SYNC_PERIOD;

        switch(process.env.CACHE_TYPE) {
            case "local":
            	//Create data folder
                //Load Local cache from file
                //Auto Save Local Cache to file
                if(!fs.existsSync('./data/')) {
                    fs.mkdirSync('./data/');
                }
                
                CACHE.loadLocalCache();

                setInterval(function() {
                    CACHE.saveLocalCache();
                }, CACHE_SYNC_PERIOD);
                break;
            case "redis":
                redis = new ioredis(process.env.CACHE_URL);
                // redis = new ioredis({
                //     enable: false,
                //     host: '127.0.0.1',   // Redis host
                //     port: 6379,          // Redis port
                //     family: 4,           // 4 (IPv4) or 6 (IPv6)
                //     //password: 'auth',
                //     db: 0
                // });
                break;
        }
        
        console.log("CACHE Initialized "+CACHE_TYPE);
    },

    listCacheKeys: function(pattern, callback) {
        if(pattern==null) pattern = "*";

        switch(process.env.CACHE_TYPE) {
            case "redis":
                keysArr = [];
                redis.keys(pattern).then(function (keys) {
                    keys.forEach(function (key) {
                    keysArr.push(key);
                    });

                    callback(keysArr);
                });
                break;
            case "local":
                return callback(LOCAL_CACHE);
                break;
        }
    },

    loadLocalCache: function() {
        if(!fs.existsSync('./data/cache.json')) {
            fs.writeFileSync('./data/cache.json', JSON.stringify({"HASH":"99914b932bd37a50b983c5e7c90ae93b","DATA":{}}));
        }
        
        try {
            var cacheData = fs.readFileSync('./data/cache.json', "utf8");
            cacheData = JSON.parse(cacheData);

            LOCAL_CACHE = cacheData.DATA;
            LOCAL_CACHE_HASH = cacheData.HASH;
        } catch(e) {
            console.log("CACHE FILE ERROR", e);
        }
    },

    saveLocalCache: function() {
        var localData = JSON.stringify(LOCAL_CACHE);
        var localHash = md5(localData);
        if(localHash!=LOCAL_CACHE_HASH) {
            console.log("CACHE Save Required");
            fs.writeFileSync('./data/cache.json', JSON.stringify({"HASH": localHash, "DATA": LOCAL_CACHE}));
            LOCAL_CACHE_HASH = localHash;
        }
    },

    cacheStatus: function() {
        switch(process.env.CACHE_TYPE) {
            case "redis":
                return redis.status;
                break;
            case "local":
                return true;
                break;
        }
    },

    clearCache: function(pattern) {
        if (pattern == null) pattern = "*";

        switch(process.env.CACHE_TYPE) {
            case "redis":
                var stream = redis.scanStream({
                    // only returns keys following the pattern of "key"
                    match: pattern,
                    // returns approximately 100 elements per call
                    count: 100
                });
            
                stream.on('data', function (resultKeys) {
                    if (resultKeys.length) {
                        redis.unlink(resultKeys);
                    }
                });
                break;
            case "local":
                LOCAL_CACHE = {};
                break;
        }
    },

    deleteData: function(cacheKey) {
        switch(process.env.CACHE_TYPE) {
            case "redis":
                redis.unlink(cacheKey);
                break;
            case "local":
                delete LOCAL_CACHE[cacheKey];
                break;
        }
        
    },

    storeData: function(cacheKey, data) {
        switch(process.env.CACHE_TYPE) {
            case "redis":
                if (redis.status != "ready") return data;

                if (typeof data == "object") data = JSON.stringify(data);

                redis.set(cacheKey, data);
                return data;
                break;
            case "local":
                LOCAL_CACHE[cacheKey] = data;
                return data;
                break;
        }
    },

    storeDataEx: function(cacheKey, data, expires) {
        switch(process.env.CACHE_TYPE) {
            case "redis":
                if (redis.status != "ready") return data;

                if (typeof data == "object") data = JSON.stringify(data);
                
                redis.set(cacheKey, data, "EX", expires);//In Seconds
                // redis.setex(cacheKey, expires, data);//OLD Format
                return data;
                break;
            case "local":
                LOCAL_CACHE[cacheKey] = data;
                return data;
                break;
        }
    },

    fetchData: function(cacheKey, callback, defaultData = false) {
        switch(process.env.CACHE_TYPE) {
            case "redis":
                if (redis.status != "ready") {
                    callback(defaultData, "error");
                    return;
                }
                cacheObj = this;
                result = false;
        
                redis.get(cacheKey).then(function (result) {
                    if (result == null) {
                        result = cacheObj.storeData(cacheKey, defaultData);
                    }
        
                    if (typeof result == "string") {
                        try {
                            resultJSON = JSON.parse(result);
                            if (resultJSON != null) {
                                result = resultJSON;
                            }
                        } catch (e) {
        
                        }
                    }
        
                    callback(result);
                });
                break;
            case "local":
                if(LOCAL_CACHE[cacheKey]==null) callback(defaultData);
                else callback(LOCAL_CACHE[cacheKey]);
                break;
        }
    }
}