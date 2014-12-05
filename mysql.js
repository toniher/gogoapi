var mysql = require('mysql');
var auto = require('./mysql.js');

var connection = null;

exports.handleDisconnect = function( db, callback ) {

	if ( ! connection ) {
		connection = mysql.createConnection(db); // Recreate the connection, since
												  // the old one cannot be reused.

		connection.connect(function(err) {              // The server is either down
			if(err) {                                     // or restarting (takes a while sometimes).
				console.log('error when connecting to db:', err);
				setTimeout( auto.handleDisconnect( db, callback ), 2000); // We introduce a delay before attempting to reconnect,
			}                                     // to avoid a hot loop, and to allow our node script to
			else {
				callback( connection );
			}
		});                                     // process asynchronous requests in the meantime.
											  // If you're also serving http, display a 503 error.
		connection.on('error', function(err) {
			console.log('db error', err);
			if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
				auto.handleDisconnect(db, callback);                         // lost due to either server restart, or a
			} else {                                      // connnection idle timeout (the wait_timeout
				throw err;                                 // server variable configures this)
			}
		});
	} else {
		connection = null;
		auto.handleDisconnect( db, callback);
	}

};

