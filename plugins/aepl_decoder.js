/*
 * AEPL Decoder Plugin
 * 
 * */

module.exports = {

    initialize: function() {
        // console.log("Plugin Initialization");
    },

    runTask: function(params, callback) {
        // console.log("Running Task", params);
        
        var axios = require("axios").default;

        var options = {
          method: 'POST',
          url: 'https://api.appleenergy.in/services/decoder/decode/',
          headers: {
            'Content-Type': 'multipart/form-data; boundary=---011000010111000001101001',
            api_key: 'VacYhjYqC3bL6wwp',
            clientid: 'com.appleenergy.exidediagnostic'
          },
          data: '-----011000010111000001101001\r\nContent-Disposition: form-data; name="tester_type"\r\n\r\nmdx650\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name="testcode"\r\n\r\nHTD116-7882U0\r\n-----011000010111000001101001--\r\n'
        };

        axios.request(options).then(function (response) {
          console.log("XXX", response.data);
          callback(response.data);
        }).catch(function (error) {
          console.error(error);
          callback(false, error);
        });
    }
}