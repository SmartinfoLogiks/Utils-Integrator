/*
 * Telegram Plugin
 * 
 * */

module.exports = {

    initialize: function() {
        console.log("Telegram Integration Initialization");
    },

    runTask: function(params, callback) {
        console.log("Running Telegram Task", params);
        callback(params);
    },

    transform: function(data, callback) {
        console.log("Running Telegram Transformer", data);
        callback(_.extend({"year": 1234}, data));
    },

    generateAuthToken: function(frontEndHandler, completionHandler) {

    }
}