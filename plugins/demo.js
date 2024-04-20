/*
 * Trello Plugin
 * 
 * */

module.exports = {

    initialize: function() {
        console.log("Demo Plugin Initialization");
    },

    runTask: function(params, callback) {
        console.log("Running Demo Task", params);
        callback(params);
    },

    transform: function(data, callback) {
        console.log("Running Demo Transformer", data);
        callback(_.extend({"year": 1234}, data));
    }
}