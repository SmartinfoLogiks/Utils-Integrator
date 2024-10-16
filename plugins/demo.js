/*
 * Demo Plugin
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
    },

    //For generation of tokens using userinput if required
    generateAuthToken: function(frontEndHandler, completionHandler) {
        //If User Interaction Required
        //OAUTH Handler
        //Others Handler
    }
}