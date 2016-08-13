var mysqlqueries = require('./mysql.js');
var mysql = require('mysql');
var async = require('async');
var functions = require('./index.js');

exports.getPool = function( config, callback ) {

	var pool  = mysql.createPool({
		host     : config.mysql.host,
		user     : config.mysql.user,
		password : config.mysql.password,
		database : config.mysql.database,
		multipleStatements: true
	});

	callback( pool );

};

exports.getUniProt = function( pool, listitem, res, callback ) {

	var mapping = {};

	pool.getConnection(function(err, connection) {

		if ( ! err ) {
			
			var queryArr = [];
			var resultArr = [];
			async.each( listitem, function( item, cb ) {

				queryArr.push( 'select uniprot from idmapping where uniprot = '+ connection.escape(item)+' or external = '+ connection.escape(item)+ ' limit 1' );
				cb();
			}, function( err ) {
				connection.query( queryArr.join(";"), function(err, results) {
					if ( err ) {
						functions.sendError( connection, res, err );
						connection.release();
					}
					else {
						async.each( results, function( result, rcb ) {
							if ( result.length > 0 ) {
								resultArr.push( result[0]);
							} else {
								if ( result ) {
										resultArr.push( result );
								} else {
										resultArr.push( null );
								}
							}
							rcb();
						}, function ( err ) {
							for ( var i = 0; i < listitem.length; i ++ ) {
								if ( resultArr[ i ] && resultArr[ i ].hasOwnProperty("uniprot") ) {
									mapping[ listitem[ i ] ] = resultArr[ i ]["uniprot"];
								}
							}
							callback( mapping );
							connection.release();
						});
					}
				});
			});

		} else {
			functions.sendError( res, err );
		}
	});

};



