var functions = require('../functions/index.js');
var neo4j = require('../functions/neo4j.js');
var request = require('request');
var async = require("async");
var mysql = require('../mysql.js');

exports.getId = function( req, res ) {

	var config = req.app.set('config');
	var taxid = req.params.id;

	if ( taxid.indexOf("-") < 0 ) {
		getInfo( config.neo4j.server, taxid, function( data ) {
			functions.returnJSON( res, data );
		});
	} else {
		var listTaxid = taxid.split("-");
		var outcome = [];
		// TODO: Check whether we handle well multiple nodes at once
		async.eachSeries( listTaxid, function( taxval, cb ) {
			getInfo( config.neo4j.server, taxval, function( data ) {
				outcome.push( data );
				cb();
			});
		}, function( err) {
			if ( err ) {
			
				var outcome = {};
				outcome.status = "Error"
				outcome.text =  err;
				functions.returnJSON( res, outcome );
			
			}
			// Return array
			functions.returnJSON( res, outcome );
		});
	}

};

exports.getSpecies = function( req, res ) {

	var config = req.app.set('config');
	
	// We get species with names with '/' -> tricky
	var name = req.params[0];

	// Hack for slash
	name = name.replace("&47;","/");

	getSpecies( config.neo4j.server, name, function( data ) {
		functions.returnJSON( res, data);
	});
};

exports.getCommon = function( req, res ){

	var list = req.params.list;
	var config = req.app.set('config');
	
	var query = config.neo4j.server+"/biodb/parent/common/tax/"+list;

	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			var jsonResult = JSON.parse( body );
			functions.returnJSON( res, jsonResult );
		} else {

			var outcome = {};
			outcome.status = "Error"
			outcome.text =  error;
			functions.returnJSON( res, outcome );

		}
	});
};

exports.getCommonList = function( req, res ){

	var config = req.app.set('config');

	var connection;

	mysql.handleDisconnect( config.db, function( connection ) {
	
		var list = req.params.list;
	
		var listarray = list.split("-");
	
		var listid = [];
	
		async.each( listarray, function( listitem, callback ) {
			getTaxID( connection, listitem, listid, res, callback );
	
		}, function( err ) {
	
			// We generate list of ID to send
			if ( listid.length > 0 ) {
			
				listidstr = listid.join("-");
			
				var query = config.neo4j.server+"/biodb/parent/common/tax/"+listidstr;
			
				request( functions.getRequest( query ), function (error, response, body) {
					if (!error && response.statusCode == 200) {
						
						var jsonResult = JSON.parse( body );
						connection.end();
						functions.returnJSON( res, jsonResult);
					} else {
			
						connection.end();
						var outcome = {};
						outcome.status = "Error"
						outcome.text =  error;
						functions.returnJSON( res, outcome);
			
					}
				});
			} else {
	
						connection.end();
						var outcome = {};
						outcome.msg = "No results!";
						functions.returnJSON( res, outcome);
			}
		});

	});
};


exports.getList = function(req, res) {

	var config = req.app.set('config');

	var connection;

	mysql.handleDisconnect( config.db, function( connection ) {

		var acc = req.params.id;
	
		// First we check whether this exists in goassociation, if so, we are done.
	
		var sql = 'SELECT a.TAXON from goataxon a where a.`UniProtKB-AC` = ' + connection.escape(acc);
		var sql2 = 'SELECT a.TAXON from goataxon a, idmapping i where a.`UniProtKB-AC` = i.`UniProtKB-AC` and i.ID=' + connection.escape(acc);
	
		connection.query(sql, function(err, results) {
	
			if ( err ) {
				functions.sendError( connection, res, err );
			} else {
	
				var golist = new Array();
		
				if ( results.length === 0 ) {
	
					connection.query(sql2, function(err, results) {
	
						if ( err ) {
							functions.sendError( connection, res, err );
						} else {
			
							var golist = new Array();
	
							if ( results.length > 0 ) {
	
								async.each( results, function( result, callback ){
									golist.push( result.TAXON );
									callback();
								},
								function( err ) {
									connection.end();
									getInfo( config.neo4j.server, golist[0], function( data ) {
										// We put original accession and let's have fun
										functions.addProp( data, "acc", acc, function( output ) {
											functions.returnJSON( res, output );
										});
									});
								});
			
							} else {
								connection.end();
								// There can be cases such as deleted entries!
								// Check http://www.uniprot.org/uniprot/B4RX92?version=*
								functions.returnJSON( res, { "msg": "No results!", "acc":acc });
							}
						}
		
					});
		
		
				} else {
		
					for (i=0; i < results.length; i++) {
						golist.push( results[i].TAXON );
					}
					connection.end();
					getInfo( config.neo4j.server, golist[0], function( data ) {
						// We put original accession and let's have fun
						functions.addProp( data, "acc", acc, function( output ) {
							functions.returnJSON( res, output);
						}); 
					});
				}
			}
	
		});
	});

};


// Return true if in group
exports.getRankAll = function( req, res ){
	
	var config = req.app.set('config');
	var taxid = req.params.id;
	
	var query = config.neo4j.server+"/biodb/parent/path/tax/"+taxid+"/1";

	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			var arrayResult = JSON.parse( body );

			var outcome = {};
			
			if ( arrayResult.length > 0 ) {
				outcome = arrayResult;
			}
			
			functions.returnJSON( res, outcome );
			
		} else {

			var outcome = {};
			outcome.status = "Error"
			outcome.text =  error;
			
			functions.returnJSON( res, outcome );

		}
	});
};

exports.getRank = function( req, res ){
	
	var config = req.app.set('config');
	var taxid = req.params.id;
	var rank = req.params.rank;
	
	var query = config.neo4j.server+"/biodb/parent/path/tax/"+taxid+"/1";
	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			var arrayResult = JSON.parse( body );
			
			if ( arrayResult.length > 0 ) {
				outcome = arrayResult;
			}
			
			// Let search
			findRank( outcome, rank, function( data ) {
				functions.returnJSON( res, data );
			});
			
		} else {

			var outcome = {};
			outcome.status = "Error"
			outcome.text =  error;
			
			functions.returnJSON( res, outcome );

		}
	});

};


exports.getTaxInfo = function( server, taxid, callback ) {
	getInfo( server, taxid, callback );
};

function getInfo( server, taxid, callback ) {
	
	var queryObj = {
		"id": parseInt( taxid, 10 ),
	};
		
	neo4j.getInfobyField( server, "TAXID", queryObj, function ( error, data ) {
				
		if (!error ) {

			var outcome;
			
			if ( data.length > 0 ) {
				outcome = data[0];
			} else {
				outcome = data;
			}
			
			callback( outcome );	
		
		} else {
			
			var outcome = {};
			outcome.status = "Error"
			outcome.text =  error;
			
			callback( outcome );		
			
		}
	});

}


function getTaxID( connection, item, listid, res, callback ) {

	// First we check whether this exists in goassociation, if so, we are done.

	var sql = 'SELECT distinct(a.TAXON) from goataxon a where a.`UniProtKB-AC` = ' + connection.escape(item);
	var sql2 = 'SELECT distinct(a.TAXON) from goataxon a, idmapping i where a.`UniProtKB-AC` = i.`UniProtKB-AC` and i.ID=' + connection.escape(item);

	connection.query(sql, function(err, results) {

		if ( err ) {
			functions.sendError( connection, res, err );
		} else {

			var golist = new Array();
	
			if ( results.length === 0 ) {

				connection.query(sql2, function(err, results) {

					if ( err ) {
						functions.sendError( connection, res, err );
					} else {
		
						var golist = new Array();

						if ( results.length > 0 ) {

							async.each( results, function( result, callback2 ){
								golist.push( result.TAXON );
								callback2();
							},
							function( err ) {
								listid.push( golist[0] );
								callback();
							});
		
						} else {
							//
						}
					}
	
				});
	
	
			} else {
	
				for (i=0; i < results.length; i++) {
					golist.push( results[i].TAXON );
				}
				listid.push( golist[0] );
				callback();

			}
		}

	});
}


// Finish callback here
function getSpecies( server, name, callback ) {

	// We should furter process params.
	var nextname = name.toLowerCase();
	if ( name === nextname ) {
		nextname = functions.capitaliseFirstLetter( name );
	} else {
		// Let's try everything lowercase
		nextname = name.toLowerCase();
	}

	// Possible names -> String dealt
	var strname = "\""+name+"\"";
	var strnextname = "\""+nextname+"\"";

	var names = { "name": [ strname, strnextname ] };
	
	// First scientific names
	neo4j.getInfobyField( server, "TAXID", { scientific_name: name }, function ( error, data ) {
				
		if (!error ) {

			var outcome = new Array();
			
			if ( data.length === 0 ) {
				
				// Then the rest
				neo4j.getInfobyFieldArray( server, "TAXID", names, function ( error, data2 ) {
				
					if (!error ) {
						
						var outcome = new Array();

						async.each( data2, function( aResult, callback2 ) {
							if ( aResult ) {
								outcome.push( aResult );
								callback2();
							}
						},
						function( err ) {
							if (err) return next(err);
							callback( outcome );
							return true;
						});
						
					} else {
						
						var outcome = {};
						outcome.status = "Error"
						outcome.text =  error;
			
						callback( outcome );		
					}
				
				});

			} else {
				
				for ( var i = 0; i < data.length; i++ ) {
					if ( data[i] ) {
						outcome.push( data[i] );
					}
				}
				callback( outcome );
			}
		
		} else {
			
			var outcome = {};
			outcome.status = "Error"
			outcome.text =  error;
			
			callback( outcome );	
		}
	});
	
}

function findRank ( outcome, rank, callback ) {

	var finalgr = {};

	async.each( outcome, function( group, cb) {

		if( group.rank === rank ) {
			finalgr = group;
		} 
		
		cb();
	} , function(err){
		if (err) return next(err);
		callback( finalgr );
	});
}


