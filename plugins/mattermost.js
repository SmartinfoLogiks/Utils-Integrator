/*
 * Mattermost Plugin
 * 
 * */

module.exports = {

    initialize: function() {
        console.log("Mattermost Integration Initialization");
    },

    runTask: function(params, callback) {
        console.log("Running Mattermost Task", params);
        callback(params);
    },

    transform: function(data, callback) {
        console.log("Running Mattermost Transformer", data);
        callback(_.extend({"year": 1234}, data));
    },

    generateAuthToken: function(frontEndHandler, completionHandler) {

    }
}