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

exports.notifyListenersPartyEnd = function(deviceIds, callback) {

    if(deviceIds.length == 0)
        return;

    var body = {};
    console.log("ids: " + deviceIds);
    body['registration_ids'] = [ deviceIds ];
    body['data'] = { "action":"end_party" };

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

    postGCM(body, post_options, callback);

};

var postGCM = function(body, post_options, callback) {
    var reqBody = JSON.stringify(body);
    
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
                callback.call(statusCode, null);
                return;
            }
            else if(statusCode == 503) {
                console.log("GCM servers unavailable");
                callback.call(statusCode, null);
                return;
            }
            else if(statusCode != 200) {
                // TODO - remove party from server if host device is no longer available
                console.log("Invalid GCM request with error code " + statusCode);
                callback.call(statusCode, null);
                return;
            }

            try {
                var data = JSON.parse(buf);
                callback.call(null, data);
                return;
            } catch (e) {
                console.log("Error handling GCM response " + e);
                callback.call("error", null);
                return;
            }
           
        });

        post.on('error', function (e) {
            console.log("Exception during GCM request: " + e);
            callback.call("request error", null);
            return;
        });
    });
};
