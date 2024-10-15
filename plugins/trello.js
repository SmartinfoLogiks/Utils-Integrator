/*
 * Trello Plugin
 * 
 * */

module.exports = {

    initialize: function() {
        console.log("Trello Integration Initialization");
    },

    runTask: function(params, callback) {
        console.log("Running Trello Task", params);
        callback(params);
    },

    transform: function(data, callback) {
        console.log("Running Trello Transformer", data);
        callback(_.extend({"year": 1234}, data));
    },

    generateAuthToken: function(frontEndHandler, completionHandler) {

    }
}