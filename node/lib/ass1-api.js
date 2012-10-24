// API implementation

var common = require('./common')

var uuid    = common.uuid
var mongodb = common.mongodb


var todocoll = null
var usercoll = null

var util = {}

util.validate = function( input ) {
  return input.text
}

util.fixid = function( doc ) {
  if( doc._id ) {
    doc.id = doc._id.toString()
    delete doc._id
  }
  else if( doc.id ) {
    doc._id = new mongodb.ObjectID(doc.id)
    delete doc.id
  }
  return doc
}


exports.ping = function( req, res ) {
  var output = {ok:true,time:new Date()}
  res.sendjson$( output )
}


exports.echo = function( req, res ) {
  var output = req.query

  if( 'POST' == req.method ) {
    output = req.body
  }

  res.sendjson$( output )
}


exports.todo = {

  create: function( req, res ) {
    var input = req.body
    
    if( !util.validate(input) ) {
      return res.send$(400, 'invalid')
    }

    // Added check and ownerId
    var todo = {
      id: uuid.v4(),
	  userId: input.userId,
	  check: input.check,
      text: input.text,
      ownerId: input.ownerId,
	  created: new Date().getTime(),
	  located: input.located,
	  latitude: input.latitude,
	  longitude: input.longitude
    }

    todocoll.insert(todo, res.err$(function( docs ){
      var output = util.fixid( docs[0] )
      res.sendjson$( output )
    }))
  },


  read: function( req, res ) {
    var input = req.params

    console.log(req.params)

    var query = util.fixid( {id:input.id} )
    todocoll.findOne( query, res.err$( function( doc ) {
      if( doc ) {
        var output = util.fixid( doc )
        res.sendjson$( output )
      }
      else {
        res.send$(404,'not found')
      }
    }))
  },


  list: function( req, res ) {
    var input = req.query
    var output = []

    var options = {sort:[['created','desc']]}

    // Added ownerId filtering
	var ownerId = 0
	if (input.ownerId) {
	  ownerId = input.ownerId
	}
    var query   = {userId:input.userId, ownerId:ownerId}

    todocoll.find( query, options, res.err$( function( cursor ) {
      cursor.toArray( res.err$( function( docs ) {
        output = docs
        output.forEach(function(item){
          util.fixid(item)
        })
        res.sendjson$( output )
      }))
    }))
  },


  update: function( req, res ) {
    var id    = req.params.id
    var input = req.body
    
    if( !util.validate(input) ) {
      return res.send$(400, 'invalid')
    }
    var query = util.fixid( {id:id} )
    todocoll.findAndModify( 
	  query, 
	  [],
	  {$set:{
	    text:input.text, 
		check:input.check, 
		located: input.located,
		latitude: input.latitude,
		longitude: input.longitude}
	  }, 
	  {new:true},
	  res.err$( function(doc) {
	    if( doc ) {
          var output = util.fixid( doc )
          res.sendjson$( output )
        }
        else {
          console.log('404')
          res.send$(404,'not found')
        }
      })
	)
  },


  del: function( req, res ) {
    var input = req.params
    // updated query to include OwnerId
    var query = {$or:[util.fixid( {id:input.id} ), {ownerId:input.id}]}
    todocoll.remove( query, res.err$( function() {
      var output = {}
      res.sendjson$( output )
    }))
  }

}

exports.user = {

  create: function( req, res ) {
    var input = req.body
    
    if( !util.validate(input) ) {
      return res.send$(400, 'invalid')
    }

    var user = {
	  id: uuid.v4(),
      user: input.user,
	  pw:input.pw,
	  created: new Date().getTime()
    }

    usercoll.insert(user, res.err$(function( docs ){
      var output = util.fixid( docs[0] )
      res.sendjson$( output )
    }))
  },


  read: function( req, res ) {
    var input = req.query

	var query = {$and:[{user:input.user}, {pw:input.pw}]}
    usercoll.findOne( query, res.err$( function( doc ) {
      if( doc ) {
        var output = util.fixid( doc )
        res.sendjson$( output )
      }
      else {
        res.send$(404,'not found')
      }
    }))
  },


  list: function( req, res ) {
    var input = req.query
    var output = []

    var options = {sort:[['created','desc']]}

    var query   = {}

    usercoll.find( query, options, res.err$( function( cursor ) {
      cursor.toArray( res.err$( function( docs ) {
        output = docs
        output.forEach(function(item){
          util.fixid(item)
        })
        res.sendjson$( output )
      }))
    }))
  },


  update: function( req, res ) {
    var id    = req.params.id
    var input = req.body
    
    if( !util.validate(input) ) {
      return res.send$(400, 'invalid')
    }

    var query = util.fixid( {id:id} )
	// TODO: Would change this to use findAndModify if use update was needed, for now leaving it to 
	// generate spurious 404
    usercoll.update( query, {$set:{pw:input.pw}}, res.err$( function( count ) {
      if( 0 < count ) {
        var output = util.fixid( doc )
        res.sendjson$( output )
      }
      else {
        console.log('404')
        res.send$(404,'not found')
      }
    }))
  },


  del: function( req, res ) {
    var input = req.params
    var query = {user:input.user}
    usercoll.remove( query, res.err$( function() {
      var output = {}
      res.sendjson$( output )
    }))
  }

}


exports.connect = function(options,callback) {
  var client = new mongodb.Db( options.name, new mongodb.Server(options.server, options.port, {}))
  client.open( function( err, client ) {
    if( err ) return callback(err);

    client.collection( 'todo', function( err, collection ) {
      if( err ) return callback(err);

      todocoll = collection
      //callback()
    })
    client.collection( 'user', function( err, collection ) {
      if( err ) return callback(err);
      usercoll = collection
      //callback()
   })
  })
  callback()
}