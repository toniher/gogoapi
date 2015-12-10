var mysqlqueries = require('./mysql.js');
var mysql = require('mysql');
var async = require('async');
var functions = require('./index.js');

var nconfig = require('../config.js');
var config = nconfig.get("express");

var pool  = mysql.createPool({
  host     : config.mysql.host,
  user     : config.mysql.user,
  password : config.mysql.password,
  database : config.mysql.db
});


exports.getTaxID = function( listitem, listid, res, callback ) {


	var listID = [];

	pool.getConnection(function(err, connection) {

		if ( ! err ) {

			var sql = "...";
			connection.query( sql, function(err, rows) {

				if ( !err ) {
					
					async.each( rows , function( row, cmysql ) {
						listID.push(  );
						cmysql();
					}, function( err ) {
						callback();
					});
				}
				// And done with the connection.
				connection.release();
				
				// Don't use the connection here, it has been returned to the pool.
			});
		}
	});

// TODO: This should be moved to mysql.js
//
//function getTaxID( connection, item, listid, res, callback ) {
//
//	// First we check whether this exists in goassociation, if so, we are done.
//
//	var sql = 'SELECT distinct(a.TAXON) from goataxon a where a.`UniProtKB-AC` = ' + connection.escape(item);
//	var sql2 = 'SELECT distinct(a.TAXON) from goataxon a, idmapping i where a.`UniProtKB-AC` = i.`UniProtKB-AC` and i.ID=' + connection.escape(item);
//
//	connection.query(sql, function(err, results) {
//
//		if ( err ) {
//			functions.sendError( connection, res, err );
//		} else {
//
//			var golist = new Array();
//	
//			if ( results.length === 0 ) {
//
//				connection.query(sql2, function(err, results) {
//
//					if ( err ) {
//						functions.sendError( connection, res, err );
//					} else {
//		
//						var golist = new Array();
//
//						if ( results.length > 0 ) {
//
//							async.each( results, function( result, callback2 ){
//								golist.push( result.TAXON );
//								callback2();
//							},
//							function( err ) {
//								listid.push( golist[0] );
//								callback();
//							});
//		
//						} else {
//							//
//						}
//					}
//	
//				});
//	
//	
//			} else {
//	
//				for (i=0; i < results.length; i++) {
//					golist.push( results[i].TAXON );
//				}
//				listid.push( golist[0] );
//				callback();
//
//			}
//		}
//
//	});
//}


//exports.getList = function(req, res) {
//
//	var config = req.app.set('config');
//
//	var connection;
//
//	mysql.handleDisconnect( config.db, function( connection ) {
//
//		var acc = req.params.id;
//	
//		// First we check whether this exists in goassociation, if so, we are done.
//	
//		var sql = 'SELECT a.TAXON from goataxon a where a.`UniProtKB-AC` = ' + connection.escape(acc);
//		var sql2 = 'SELECT a.TAXON from goataxon a, idmapping i where a.`UniProtKB-AC` = i.`UniProtKB-AC` and i.ID=' + connection.escape(acc);
//	
//		connection.query(sql, function(err, results) {
//	
//			if ( err ) {
//				functions.sendError( connection, res, err );
//			} else {
//	
//				var golist = new Array();
//		
//				if ( results.length === 0 ) {
//	
//					connection.query(sql2, function(err, results) {
//	
//						if ( err ) {
//							functions.sendError( connection, res, err );
//						} else {
//			
//							var golist = new Array();
//	
//							if ( results.length > 0 ) {
//	
//								async.each( results, function( result, callback ){
//									golist.push( result.TAXON );
//									callback();
//								},
//								function( err ) {
//									connection.end();
//									getInfo( config.neo4j.server, golist[0], function( data ) {
//										// We put original accession and let's have fun
//										functions.addProp( data, "acc", acc, function( output ) {
//											functions.returnJSON( res, output );
//										});
//									});
//								});
//			
//							} else {
//								connection.end();
//								// There can be cases such as deleted entries!
//								// Check http://www.uniprot.org/uniprot/B4RX92?version=*
//								functions.returnJSON( res, { "msg": "No results!", "acc":acc });
//							}
//						}
//		
//					});
//		
//		
//				} else {
//		
//					for (i=0; i < results.length; i++) {
//						golist.push( results[i].TAXON );
//					}
//					connection.end();
//					getInfo( config.neo4j.server, golist[0], function( data ) {
//						// We put original accession and let's have fun
//						functions.addProp( data, "acc", acc, function( output ) {
//							functions.returnJSON( res, output);
//						}); 
//					});
//				}
//			}
//	
//		});
//	});
//
//};
//



};