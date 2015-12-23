var functions = require('../functions/index.js');
var neo4j = require('../functions/neo4j.js');
var request = require('request');
var async = require("async");
var mysqlqueries = require('../functions/mysql.js');

exports.getId = function( req, res ){

	var acc = req.params.id;
	var config = req.app.set('config');
	
	var queryObj = {
		acc: acc,
	};
		
	neo4j.getInfobyField( config.neo4j.server, "GO_TERM", queryObj, function ( error, data ) {
				
		if (!error ) {
			functions.returnJSON( res, data );
			
		} else {
			
			var outcome = {};
			outcome.status = "Error"
			outcome.text =  error;
			
			functions.returnJSON( res, outcome );
			
		}
	});
	
};


exports.getCommon = function( req, res ){

	var list = req.params.list;
	
	var config = req.app.set('config');
	
	var query = config.neo4j.server+"/biodb/parent/common/go/"+list;

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
	
	var list = req.params.list;

	var listarray = list.split("-");

	// we store list GO here
	var listGO = {
		"molecular_function": [],
		"biological_process": [],
		"cellular_component": []
	};
	
	// We store descriptions here
	var listdesc = {};

	async.each( listarray, function( listitem, callback ) {
		// TODO: MySQL queries
		mysqlqueries.getGO( listitem, listGO, listdesc, res, callback );

	}, function( err ) {
		
		if ( err ) {
			// TODO: Handle error functions.sendError( res, err );
		}

		var numEntries = listarray.length;
		var highlight = numEntries;
		if ( numEntries > 2 ) {
			highlight = Math.ceil( numEntries/2 ) + 1; //Formula for highlighting
		}
		
		var typesgo = [];
		for ( var typego in listGO ){
			typesgo.push( typego );
		}
		
		async.each( typesgo, function( typego, callback ) {
			
			console.log("Type: "+typego);
			var countGO = {};
			
			for (var v=0; v < listGO[typego].length; v++ ) {
				if ( listGO[typego][v] in countGO ) {
					countGO[listGO[typego][v]]+=1;
				} else {
					countGO[listGO[typego][v]]=1;
				}
			}
			
			var highlighted = [];
			var less = [];
			var allpre = [];
			
			for ( var k in countGO ){
				if ( countGO.hasOwnProperty(k) ) {
					if ( countGO[k] >= highlight ) {
						highlighted.push( k );
					} else {
						less.pushIfNotExist( k, function(e) { 
							return e === k; 
						});
					}
					
					allpre.pushIfNotExist( k, function(e) { 
						return e === k; 
					});
				}
			}
			
			var rest = [];
			var common = [];

			
			console.log( "High: "+highlighted );
			console.log( "Less: "+less );
			// Commutations of Less
			var r = Math.ceil( ( less.length ) / 2 );
			// If only two, compare two
			if ( less.length === 2 ) {
				r = 2;
			}
			
			// At least compare 2 for being representative
			if ( r > 1 ) {

				// We choose entries first to consider;
				functions.printCombination( less, r, rest );
				
			}
			
			async.each( rest, function( item, callback2 ) {
				
				if ( item.length > 0 ) {
					getCommonGO( config, item, common, typego, callback2 );
				} else {
					callback2();
				}
				
			}, function( err ) {
				
				if ( err ) {
					functions.sendError( connection, res, err );
				}
				
				for ( var h=0; h < highlighted.length; h++ ) {
					common.pushIfNotExist( highlighted[h], function(e) { 
						return e === highlighted[h]; 
					});
				}
				
				// Let's clear previous listGO
				listGO[typego].length = 0;
				listGO[typego] = common;
				// console.log( "COMMON - "+typego+": "+common );
				callback();
			});
			
			//console.log( all );
		}, function ( err ) {
			
			if ( err ) {
				functions.sendError( connection, res, err );
			}
			
			// Let's add name to ListGO
			var finalGO = {};
			for ( var k in listGO ){
				if ( listGO.hasOwnProperty(k) ) {
					
					finalGO[k] = [];
					
					for ( var f=0; f < listGO[k].length; f++ ) {
						var acc = listGO[k][f];
						var name = listdesc[acc];
						var go = {
							"acc": acc,
							"name": name
						};
						finalGO[k].push( go );
					}
					
				}
			}
			
			// connection.end();
			functions.returnJSON( res, finalGO);
		});
	});

};


function getGO( connection, item, listGO, listdesc, res, callback ) {

	// First we check whether this exists in goassociation, if so, we are done.
	var sql = 'SELECT distinct(a.GO), t.term_type, t.name from goassociation a, term t where t.acc=a.GO AND a.`UniProtKB-AC` = ' + connection.escape(item);
	var sql2 = 'SELECT distinct(a.GO), t.term_type, t.name from goassociation a, term t, idmapping i where t.acc=a.GO AND a.`UniProtKB-AC` = i.`UniProtKB-AC` and i.ID=' + connection.escape(item);

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
								
								golist.push( { acc: result.GO, term_type: result.term_type, name: result.name } );
								callback2();
							},
							function( err ) {

								for ( var i = 0; i < golist.length; i++ ) {

									var term_type = golist[i].term_type;
									var acc = golist[i].acc;
									var name = golist[i].name;
									listGO[term_type].push( acc );
									listdesc[ acc ] = name;
									//listGO[term_type].pushIfNotExist( acc, function(e) { 
									//	return e === acc; 
									//});
								}

								callback();
							});
		
						} else {
							// Temporary sendError
							functions.sendError( connection, res, err );
						}
					}
	
				});
	
	
			} else {
	
				for ( var i = 0; i < results.length; i++ ) {
	
					var term_type = results[i].term_type;
					var acc = results[i].GO;
					var name = results[i].name;
					listGO[term_type].push( acc );
					listdesc[ acc ] = name;
					//listGO[term_type].pushIfNotExist( acc,  function(e) { 
					//	return e === acc; 
					//});
				}
				callback();

			}
		}

	});

}

function getCommonGO( config, listGO, array, typego, callback ) {
	
	var server = config.neo4j.server;

	var query = server+"/biodb/parent/common/go/"+listGO.join("-");
	
	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			var jsonResult = JSON.parse( body );
			if ( config.rootGO[typego] !== jsonResult.acc ) {
				array.pushIfNotExist( jsonResult.acc, function(e) { 
					return e === jsonResult.acc; 
				});
			}
			callback();
		}
	});
	
}

// http://stackoverflow.com/questions/1988349/array-push-if-does-not-exist
// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function(comparer) { 
	for(var i=0; i < this.length; i++) { 
		if(comparer(this[i])) return true; 
	}
	return false; 
}; 

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function(element, comparer) { 
	if (!this.inArray(comparer)) {
		this.push(element);
	}
};

