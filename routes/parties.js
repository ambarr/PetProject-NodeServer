var push = require('./push');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var db = mongoose.createConnection(process.env.MONGOLAB_URI);
db.on('open', function() {
    console.log("Mongolab connection open!");
});

/*
 * Database models
 */

var Song = new Schema({
    Title       : String,
    ArtistName  : String,
    Source      : String
});

var Artist = new Schema({
    Name  : String,
    Songs : [Song]
});

var Party = new Schema({
    Name       : String,
    Password   : String,
    DeviceID   : String,
    Artists    : [Artist],
    Listeners  : [String],
    Requests   : [Song],
    NowPlaying : {
        Artist : String,
        Song   : String
    },
    PartyLoc   : {
        lng : Number,
        lat : Number
    }
});

var PartyModel = db.model('PartyModel', Party);

/*
 * POST/DELETE
 */

exports.add = function(req, res) {

    var newParty = new PartyModel({
        Name     : req.body.Name,
        Password : req.body.Password,
        DeviceID : req.body.DeviceID,
        Artists  : req.body.Artists,
        Listeners: [],
        Requests : [],
        NowPlaying : {
            Artist : "",
            Song   : ""
        },
        PartyLoc : {
            lng : req.body.Long,
            lat : req.body.Lat
        }
    });

    newParty.save(function(err) {
        if(err) {
            console.log("add_error " + err);
            res.send(500, 'Ruh-roh');
            return;
        }

        console.log("Party: " + req.body.Name + " saved.");
        res.send(newParty._id);
    }); 
};

exports.end = function(req, res) { 
    PartyModel.findOne( { _id : req.params.id }, function(err, party) { 
        var listeners = party.Listeners;
        push.notifyListeners(listeners, "end_party", function(err, response) {
            console.log(response);
            
            if(err) {
                // TODO - Need to hold on to some info, so as to retry after party
                // is removed from db
                console.log(err);
            }
        }); 
    });

    PartyModel.remove({ _id: req.params.id }, function(err) {
        if(err) res.send(500, "Couldn't delete party");
        res.send("Success"); 
    }); 

};

exports.request = function(req, res) {
    var deviceId; 
    PartyModel.findOne( { _id : req.body.hostID }, function(err, parties) { 
        if(err) {
            next(err);
            res.send(err);
            return;
        }
        else {      
            console.log("Requesting songs for party : " + parties.Name);
            console.log(parties.Requests);
            for(var i = 0; i < req.body.songNames.length; i++) { 
                parties.Requests.push(req.body.songNames[i]); 
            }
            parties.save(function(e, party) {
                if(e) {
                    res.send(500, "Error updating party");
                    return;
                }
            });
            push.notifyHost(parties.DeviceID, function(err, response) {
                res.send(200, "Success");
            }); 
        }
    });
};

exports.nowPlaying = function(req, res) {
    PartyModel.findOne( { _id : req.body.id }, function(err, party) {
        if(err) {
            next(err);
            res.send(401, 'Party not on server');
        }

        party.NowPlaying = {
            Artist : req.body.ArtistName,
            Song   : req.body.SongTitle
        };
        
        party.save(function(saveErr, party) {
            if(saveErr) {
                res.send(500, "Error updating party");
                return;
            }
            else
                res.send(200, "Success");
        });

        var listeners = party.Listeners;

        push.notifyListeners(listeners, "now_playing", function(notifyErr, response) {
            if(notifyErr) {
                // TODO - retry?
            }
        });
    });
};

exports.join = function(req, res) {
    PartyModel.findOne( { _id : req.body.id }, function (err, parties) {
        if(err) {
            next(err);
            res.send(401, 'Party not on server');
        }
        
        if(req.body.deviceID == null) {
            res.send("400", "Provide device Id");
            return;
        }

        parties.Listeners.push(req.body.deviceID);
        parties.save(function(e, party) {
            if(e) {
                res.send(500, "Error adding listener");
                return;
            }
        });

        res.send(parties.Artists);
    });
};

exports.leave = function(req, res) {
    PartyModel.findOne( { _id : req.body.id }, function(err, party) {
        if(err) {
            next(err);
            res.send(401, 'Party not on server');
        }

        parties.Listeners.remove(req.body.deviceID);
        var arr = parties.Listeners;
        for(var i = 0; i < arr.length; i++) {
            if(arr[i] == req.body.deviceID) {
                arr = arr.splice(i, 1);
            }
        }
        
        parties.Listeners = arr;
        parties.save(function(e, party) {
            if(e) {
                res.send(500, "Error removing listener");
            }
        });

        res.send(200, 'success');
    });
};

/*
 * GET
 */

exports.getAllParties = function(req, res) {
    PartyModel.find({}, function(err, parties) {
        if(err) {
            next(err);
            res.send(400, err);
        }
        /*var arr = [];
        for(i = 0; i < parties.results.length; i++) {
            var hasPassword=true;
            if(parties.results[i].obj.Password == "" || parties.results[i].obj.Password == null)
                hasPassword=false;
            var obj = { 
                "Name": parties.results[i].obj.Name,
                "Password": hasPassword,
                "id": parties.results[i].obj._id
            }
            arr.push(obj);
        }*/
        res.send(200, parties);
    });
}

exports.findNearby = function(req, res) { 
    var lat = Number(req.query.lat);
    var lng = Number(req.query.lng);
    console.log("lat: " + lat + " lng: " + lng);
    PartyModel.collection.geoNear(lng, lat,
            { spherical : true, maxDistance : 1000 }, 
            function(err, parties) {
                if(err) {
                    next(err);
                    res.send(err);
                }
 
                var arr = []; 
                for(i = 0; i < parties.results.length; i++) {
                    var hasPassword = true;
                    if(parties.results[i].obj.Password == "" 
                            || parties.results[i].obj.Password == null)
                        hasPassword = false;

                    var obj = { "Name":parties.results[i].obj.Name,
                                "Password" : hasPassword,
                                "id"  :parties.results[i].obj._id
                              };
                   
                    arr.push(obj);
                }
                res.send(arr);
            }
        );
}

exports.findByName = function(req, res) {
    PartyModel.find({ "Name" : req.query.name }, function(err, parties) {
        if(err) {
            next(err);
            res.send(err);
        }

        console.log("find_by_name: " + req.query.name); 
        res.send(parties);
    });
}



exports.getRequests = function(req, res) {
    //TODO - Authenticate host?
    
    PartyModel.findOne( { _id : req.params.id }, function(err, party) {
        if(err) {
            res.send(err);
        }
        else {
            res.send(party.Requests);
            party.Requests = [];
            party.save(function(err, party) {
                if(err) {
                    console.log("Error saving party after clearing requests");
                }
            });
        }
    });
}

exports.getNowPlaying = function(req, res) {
    PartyModel.findOne({_id : req.param.id }, function(err, party) {
        if(err) {
            res.send(err);
        }
        else {
            res.send(party.NowPlaying);
        }
    });
};
