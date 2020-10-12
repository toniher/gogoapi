var mysqlqueries = require('./mysql.js');
var mysql = require('mysql');
var async = require('async');
var functions = require('./index.js');
var pool = false;

exports.getPool = function( config, callback ) {

	if ( ! pool ) {

		pool  = mysql.createPool({
			host     : config.mysql.host,
			user     : config.mysql.user,
			password : config.mysql.password,
			database : config.mysql.database,
			multipleStatements: true
		});

		callback( pool );

	} else {
		callback( pool );
	}

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
						connection.release();
						functions.sendError( connection, res, err );
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
							connection.release();
							callback( mapping );
						});
					}
				});
			});

		} else {
			functions.sendError( res, err );
		}
	});

};

exports.getUniProtGOA = function( pool, listitem, method, res, callback ) {

	var golist = {};

	pool.getConnection(function(err, connection) {

		if ( ! err ) {

			let queryArr = [];

			for ( let item of listitem ) {
				queryArr.push( connection.escape(item) );
			}

			let queryStr = "select GO, ID from goassociation where ID in " + queryArr.join(",") + "group by GO, ID order by GO, ID";

			connection.query( queryStr, function(err, results) {
					if ( err ) {
						connection.release();
						functions.sendError( connection, res, err );
					}
					else {
						if ( results.length > 0 ) {

							// Process results
							let procResults = processGOresults( results, method );
							// Group results
							golist = groupGOresults( procResults );

						}

						connection.release();
						callback( golist );

					}

			});

		} else {
			functions.sendError( res, err );
		}

	});

};

exports.getTaxonomy = function( pool, listitem, res, callback ) {

	var mapping = {};

	pool.getConnection(function(err, connection) {

		if ( ! err ) {

			var queryArr = [];
			var resultArr = [];
			async.each( listitem, function( item, cb ) {

				queryArr.push( 'select tax_id from ncbi_names where name_txt = '+ connection.escape(item)+' limit 1' );
				cb();
			}, function( err ) {
				connection.query( queryArr.join(";"), function(err, results) {
					if ( err ) {
						connection.release();
						functions.sendError( connection, res, err );
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
								if ( resultArr[ i ] && resultArr[ i ].hasOwnProperty("tax_id") ) {
									mapping[ listitem[ i ] ] = resultArr[ i ]["tax_id"];
								}
							}
							connection.release();
							callback( mapping );
						});
					}
				});
			});

		} else {
			functions.sendError( res, err );
		}
	});

};

function processGOresults( results ) {


}


function groupGOresults( results ) {


}
