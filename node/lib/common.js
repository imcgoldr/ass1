var buffer = exports.buffer = require('buffer')

// npm modules
exports.connect = require('connect')
exports.uuid    = require('node-uuid')
exports.mongodb = require('mongodb')
exports.memcached = require( 'memcached' )


exports.sendjson = function(res,obj){
  var objstr = JSON.stringify(obj)
  console.log('SENDJSON:'+objstr);

  res.writeHead(200,{
    'Content-Type': 'application/json',
    'Cache-Control': 'private, max-age=0, no-cache, no-store',
    "Content-Length": buffer.Buffer.byteLength(objstr) 
  })
  
  res.end( objstr )
}