var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var db = mongoose.createConnection('mongodb://Pet:party@ds031857.mongolab.com:31857/petproject');
db.on('open', function() {
  console.log("Mongolab connection open!");
});

/*
 * Database models
 */

var Song = new Schema({
    Title : String
});

var Artist = new Schema({
    Name  : String,
    Songs : [Song]
});

var Party = new Schema({
    Name     : String,
    Password : String,
    Artists  : [Artist],
    PartyLoc : {
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
        Artists  : req.body.Artists,
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
     
    PartyModel.remove({ _id: req.params.id }, function(err) {
        if(err) res.send(500, "Couldn't delete party");
        res.send("Success");
    });
    res.send("Success"); 
};

exports.request = function(req, res) {
    
}

/*
 * GET
 */

exports.findNearby = function(req, res) { 
    var lat = Number(req.query.lat);
    var lng = Number(req.query.lng);
    PartyModel.collection.geoNear(lng, lat,
            { spherical : true, maxDistance : 1000 }, 
            function(err, parties) {
                if(err) {
                    next(err);
                    res.send(err);
                }
                console.log(parties.results[0].obj.Name);
                res.send(parties.results);
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

exports.join = function(req, res) {
    PartyModel.findOne( { _id : req.body.id }, function (err, parties) {
        if(err) {
            next(err);
            res.send(err);
        }
        
        res.send(parties.Artists);
    });
}