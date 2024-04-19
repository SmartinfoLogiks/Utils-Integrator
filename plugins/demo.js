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
        callback(true);
    }
}