var http = require('http');

exports.notifyHost = function(deviceId, callback) {
    var body = {};
    body['registration_ids'] = [ deviceId ];
    body['data'] = { "action":"song_requests" };

    var reqBody = JSON.stringify(body);
    var post_options = {
        host: 'android.googleapis.com',
        port: '80',
        path: '/gcm/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-length': Buffer.byteLength(reqBody, 'utf8'),
            'Authorization': 'key=' + process.env.BROWSER_KEY 
        }
    };
 
    var post = http.request(post_options, function(res) {
        var statusCode = res.statusCode;
        var buf = '';
        
        res.setEncoding('utf8');
        res.on('data', function(data) {
            buf += data;
        });
        
        res.on('end', function() {
            if(statusCode == 401) {
                console.log("Unauthorized GCM API key"); 
                return callback(statusCode, null);
            }
            else if(statusCode == 503) {
                console.log("GCM servers unavailable");
                return callback(statusCode, null);
            }
            else if(statusCode != 200) {
                // TODO - remove party from server if host device is no longer available
                console.log("Invalid GCM request with error code " + statusCode);
                return callback(statusCode, null);
            }

            try {
                var data = JSON.parse(buf);
                callback(null, data);
            } catch (e) {
                console.log("Error handling GCM response " + e);
                callback("error", null);
            }
        });

        post.on('error', function (e) {
            console.log("Exception during GCM request: " + e);
            return callback("request error", null);
        });
    });
    
    post.write(reqBody);
    post.end(); 
};

exports.notifyListeners = function(deviceIds, action, callback) {

    if(deviceIds.length == 0)
        return;

    var body = {}; 
    body['registration_ids'] = deviceIds;
    body['data'] = {"action":action};

    var reqBody = JSON.stringify(body);
    var post_options = {
        host: 'android.googleapis.com',
        port: '80',
        path: '/gcm/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-length': Buffer.byteLength(reqBody, 'utf8'),
            'Authorization': 'key=' + process.env.BROWSER_KEY 
        }
    };


    var post = http.request(post_options, function(res) {
        var statusCode = res.statusCode;
        var buf = '';
        
        res.setEncoding('utf8');
        res.on('data', function(data) {
            buf += data;
        });
        
        res.on('end', function() {
            if(statusCode == 401) {
                console.log("Unauthorized GCM API key"); 
                return callback(statusCode, null);
            }
            else if(statusCode == 503) {
                console.log("GCM servers unavailable");
                return callback(statusCode, null);
            }
            else if(statusCode != 200) {
                // TODO - remove party from server if host device is no longer available
                console.log("Invalid GCM request with error code " + statusCode);
                return callback(statusCode, null);
            }

            try {
                var data = JSON.parse(buf);
                callback(null, data);
            } catch (e) {
                console.log("Error handling GCM response " + e);
                callback("error", null);
            }
        });

        post.on('error', function (e) {
            console.log("Exception during GCM request: " + e);
            return callback("request error", null);
        });
    });
    
    post.write(reqBody);
    post.end(); 
};
