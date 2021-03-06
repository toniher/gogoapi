var functions = require('../functions/index.js');
var neo4j = require('../functions/neo4j.js');
var request = require('request');
var async = require("async");
var mysqlqueries = require('../functions/mysql.js');

exports.getId = function( req, res ) {

	var config = req.app.set('config');
	var taxid = req.params.id;

	var outcome = [];

	if ( taxid.indexOf("-") < 0 ) {
		getInfo( config.neo4j.server, taxid, function( data ) {
			functions.returnJSON( res, data );
		});
	} else {
		var listTaxid = taxid.split("-");
		// TODO: Check whether we handle well multiple nodes at once
		async.eachSeries( listTaxid, function( taxval, cb ) {
			getInfo( config.neo4j.server, taxval, function( data ) {
				outcome.push( data );
				cb();
			});
		}, function( err) {
			if ( err ) {
			
				var out = {};
				out.status = "Error";
				out.text =  err;
				functions.returnJSON( res, out );
			
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

exports.getSpeciesMySQL = function( req, res ) {

	var config = req.app.set('config');
	
	// We get species with names with '/' -> tricky
	var name = req.params[0];

	// Hack for slash
	name = name.replace("&47;","/");

	getSpeciesMySQL( config, name, res, function( data ) {
		functions.returnJSON( res, data );
	});
};

exports.getCommon = function( req, res ){

	var list = req.params.list;
	var config = req.app.set('config');
	
	var query = config.neo4j.server+config.neo4j.extpath+"/common/tax/"+list;

	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode === 200) {
			
			var jsonResult = JSON.parse( body );
			functions.returnJSON( res, jsonResult );
		} else {

			var outcome = {};
			outcome.status = "Error";
			outcome.text =  error;
			functions.returnJSON( res, outcome );

		}
	});
};

exports.getListUniProt = function( req, res ){

	var config = req.app.set('config');
	
	var list = req.params.list;

	var listarray = list.split("-");

	var method = "all";
	if ( req.params.method ) {
		method = req.params.method;
	}

	mysqlqueries.getPool( config, function( pool ) {

		mysqlqueries.getUniProt( pool, listarray, res, function( mapping ) {
			var keys = Object.keys(mapping);
			var values = keys.map(function(v) { return mapping[v]; });

			if ( values.length > 0 ) {

				var query = config.neo4j.server+config.neo4j.extpath+"/rels/tax/"+values.join("-")+"/"+method;
			
				request( functions.getRequest( query ), function (error, response, body) {
					if (!error && response.statusCode === 200) {
						
						var jsonResult = JSON.parse( body );
						functions.returnJSON( res, { "outcome": jsonResult, "query": mapping } );
					} else {
			
						var outcome = {};
						outcome.status = "Error";
						outcome.text =  error;
						functions.returnJSON( res, outcome );
			
					}
				});
			} else {
				functions.returnJSON( res, { "query": mapping } );
			}
		});
	});

};

//exports.getCommonList = function( req, res ){
//
//	var config = req.app.set('config');
//
//	var list = req.params.list;
//
//	var listarray = list.split("-");
//
//	var listid = [];
//
//	async.each( listarray, function( listitem, callback ) {
//
//		mysqlqueries.getPool( config, function( pool ) {
//			mysqlqueries.getTaxID( pool, listitem, listid, res, callback );
//		});
//
//	}, function( err ) {
//
//		// We generate list of ID to send
//		if ( listid.length > 0 ) {
//		
//			var listidstr = listid.join("-");
//		
//			var query = config.neo4j.server+config.neo4j.extpath+"/common/tax/"+listidstr;
//		
//			request( functions.getRequest( query ), function (error, response, body) {
//				if (!error && response.statusCode === 200) {
//					
//					var jsonResult = JSON.parse( body );
//					functions.returnJSON( res, jsonResult);
//				} else {
//		
//					var outcome = {};
//					outcome.status = "Error";
//					outcome.text =  error;
//					functions.returnJSON( res, outcome);
//		
//				}
//			});
//		} else {
//
//					var outcome = {};
//					outcome.msg = "No results!";
//					functions.returnJSON( res, outcome);
//		}
//	});
//};


// Return true if in group
exports.getRankAll = function( req, res ){
	
	var config = req.app.set('config');
	var taxid = req.params.id;
	var outcome = {};

	var query = config.neo4j.server+config.neo4j.extpath+"/path/tax/"+taxid+"/1";

	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode === 200) {
			
			var arrayResult = JSON.parse( body );

			
			if ( arrayResult.length > 0 ) {
				outcome = arrayResult;
			}
			
			functions.returnJSON( res, outcome );
			
		} else {

			outcome.status = "Error";
			outcome.text =  error;
			
			functions.returnJSON( res, outcome );

		}
	});
};

exports.getRank = function( req, res ){
	
	var config = req.app.set('config');
	var taxid = req.params.id;
	var rank = req.params.rank;
	
	var query = config.neo4j.server+config.neo4j.extpath+"/path/tax/"+taxid+"/1";
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
			outcome.status = "Error";
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
		id: parseInt( taxid, 10 ),
	};

	var outcome;

	neo4j.getInfobyField( server, "TAXID", queryObj, function ( error, data ) {
				
		if (!error ) {

			if ( data.length > 0 ) {
				outcome = data[0];
			} else {
				outcome = data;
			}
			
			callback( outcome );	
		
		} else {
			
			outcome = {};
			outcome.status = "Error";
			outcome.text =  error;
			
			callback( outcome );
			
		}
	});

}


// Finish callback here
//function getSpecies( server, name, callback ) {
//
//	// We should furter process params.
//	var nextname = name.toLowerCase();
//	if ( name === nextname ) {
//		nextname = functions.capitaliseFirstLetter( name );
//	} else {
//		// Let's try everything lowercase
//		nextname = name.toLowerCase();
//	}
//
//	// Possible names -> String dealt
//	var strname = "\""+name+"\"";
//	var strnextname = "\""+nextname+"\"";
//
//	var names = { "name": [ strname, strnextname ] };
//	
//	// First scientific names
//	neo4j.getInfobyField( server, "TAXID", { scientific_name: name }, function ( error, data ) {
//				
//		if (!error ) {
//
//			var outcome = [];
//			
//			if ( data.length === 0 ) {
//				
//				// Then the rest
//				neo4j.getInfobyFieldArray( server, "TAXID", names, function ( error, data2 ) {
//				
//					if (!error ) {
//						
//						var outcome = [];
//
//						async.each( data2, function( aResult, callback2 ) {
//							if ( aResult ) {
//								outcome.push( aResult );
//								callback2();
//							}
//						},
//						function( err ) {
//							if (err) return next(err);
//							callback( outcome );
//							return true;
//						});
//						
//					} else {
//						
//						var outcome = {};
//						outcome.status = "Error";
//						outcome.text =  error;
//			
//						callback( outcome );
//					}
//				
//				});
//
//			} else {
//				
//				
//				for ( var i = 0; i < data.length; i++ ) {
//					if ( data[i] ) {
//						outcome.push( data[i] );
//					}
//				}
//				callback( outcome );
//			}
//		
//		} else {
//			
//			var outcome = {};
//			outcome.status = "Error";
//			outcome.text =  error;
//			
//			callback( outcome );
//		}
//	});
//	
//}

// Handle via MySQL and Neo4j
function getSpeciesMySQL( config, name, res, callback ) {

	// We should furter process params.
	var nextname = name.toLowerCase();
	if ( name === nextname ) {
		nextname = functions.capitaliseFirstLetter( name );
	} else {
		// Let's try everything lowercase
		nextname = name.toLowerCase();
	}

	var listarray = [ name, nextname ];
	

	mysqlqueries.getPool( config, function( pool ) {

		mysqlqueries.getTaxonomy( pool, listarray, res, function( mapping ) {

			var ids = [];
			for ( var key in mapping ) {
				if ( mapping.hasOwnProperty(key) ) {
					if (ids.indexOf( mapping[key] ) === -1) {
						ids.push( mapping[key] );
					}
				}
			}

			var outcome = [];

			async.each( ids, function( id, cb ) {
				if ( id ) {
					// Get ID from Neo4j
					neo4j.getInfobyField( config.neo4j.server, "TAXID", { id: id }, function ( error, data ) {
						if (!error ) {
					
							for ( var i = 0; i < data.length; i++ ) {
								if ( data[i] ) {
									outcome.push( data[i] );
								}
							}
							cb();
						}
					});
				}
			},
			function( err ) {
				if (err) return next(err);
				callback( outcome );
				return true;
			});

		});

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


