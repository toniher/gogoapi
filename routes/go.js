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
			outcome.status = "Error";
			outcome.text =  error;
			
			functions.returnJSON( res, outcome );
			
		}
	});
	
};


exports.getCommon = function( req, res ){

	var list = req.params.list;
	
	var config = req.app.set('config');
	
	var query = config.neo4j.server+config.neo4j.extpath+"/common/go/"+list;

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

	// we store list GO here
	var listGO = {
		"molecular_function": [],
		"biological_process": [],
		"cellular_component": []
	};

	// We store descriptions here
	var listdesc = {};

	mysqlqueries.getPool( config, function( pool ) {

		mysqlqueries.getUniProt( pool, listarray, res, function( mapping ) {
			var keys = Object.keys(mapping);
			var values = keys.map(function(v) { return mapping[v]; });

			if ( values.length > 0 ) {

				var query = config.neo4j.server+config.neo4j.extpath+"/rels/go/"+values.join("-");
			
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
//	// we store list GO here
//	var listGO = {
//		"molecular_function": [],
//		"biological_process": [],
//		"cellular_component": []
//	};
//	
//	// We store descriptions here
//	var listdesc = {};
//
//	async.each( listarray, function( listitem, callback ) {
//
//		mysqlqueries.getPool( config, function( pool ) {
//
//			mysqlqueries.getGO( pool, listitem, listGO, listdesc, res, callback );
//		});
//
//	}, function( err ) {
//		
//		if ( err ) {
//			functions.sendError( res, err );
//		}
//
//		var numEntries = listarray.length;
//		var highlight = numEntries;
//		if ( numEntries > 2 ) {
//			highlight = Math.ceil( numEntries/2 ) + 1; //Formula for highlighting
//		}
//		
//		var typesgo = [];
//		for ( var typego in listGO ){
//			if ( listGO.hasOwnProperty(typego) ) {
//				typesgo.push( typego );
//			}
//		}
//		
//		async.each( typesgo, function( typego, callback ) {
//			
//			console.log("Type: "+typego);
//			var countGO = {};
//			
//			for (var v=0; v < listGO[typego].length; v++ ) {
//				if ( listGO[typego][v] in countGO ) {
//					countGO[listGO[typego][v]]+=1;
//				} else {
//					countGO[listGO[typego][v]]=1;
//				}
//			}
//			
//			var highlighted = [];
//			var less = [];
//			var allpre = [];
//			
//			for ( var k in countGO ){
//				if ( countGO.hasOwnProperty(k) ) {
//					if ( countGO[k] >= highlight ) {
//						highlighted.push( k );
//					} else {
//						less.pushIfNotExist( k, function(e) { 
//							return e === k; 
//						});
//					}
//					
//					allpre.pushIfNotExist( k, function(e) { 
//						return e === k; 
//					});
//				}
//			}
//			
//			var rest = [];
//			var common = [];
//
//			
//			console.log( "High: "+highlighted );
//			console.log( "Less: "+less );
//			// Commutations of Less
//			var r = Math.ceil( ( less.length ) / 2 );
//			// If only two, compare two
//			if ( less.length === 2 ) {
//				r = 2;
//			}
//			
//			// At least compare 2 for being representative
//			if ( r > 1 ) {
//
//				// We choose entries first to consider;
//				functions.printCombination( less, r, rest );
//				
//			}
//			
//			async.each( rest, function( item, callback2 ) {
//				
//				if ( item.length > 0 ) {
//					getCommonGO( config, item, common, typego, callback2 );
//				} else {
//					callback2();
//				}
//				
//			}, function( err ) {
//				
//				if ( err ) {
//					functions.sendError( res, err );
//				}
//				
//				for ( var h=0; h < highlighted.length; h++ ) {
//					common.pushIfNotExist( highlighted[h], function(e) { 
//						return e === highlighted[h]; 
//					});
//				}
//				
//				// Let's clear previous listGO
//				listGO[typego].length = 0;
//				listGO[typego] = common;
//				// console.log( "COMMON - "+typego+": "+common );
//				callback();
//			});
//			
//			//console.log( all );
//		}, function ( err ) {
//			
//			if ( err ) {
//				functions.sendError( res, err );
//			}
//			
//			// Let's add name to ListGO
//			var finalGO = {};
//			for ( var k in listGO ){
//				if ( listGO.hasOwnProperty(k) ) {
//					
//					finalGO[k] = [];
//					
//					for ( var f=0; f < listGO[k].length; f++ ) {
//						var acc = listGO[k][f];
//						var name = listdesc[acc];
//						var go = {
//							"acc": acc,
//							"name": name
//						};
//						finalGO[k].push( go );
//					}
//					
//				}
//			}
//			
//			functions.returnJSON( res, finalGO);
//		});
//	});
//
//};
//
//
//
//function getCommonGO( config, listGO, array, typego, callback ) {
//	
//	var server = config.neo4j.server;
//
//	var query = server+config.neo4j.extpath+"/common/go/"+listGO.join("-");
//	
//	request( functions.getRequest( query ), function (error, response, body) {
//		if (!error && response.statusCode === 200) {
//			
//			var jsonResult = JSON.parse( body );
//			if ( config.rootGO[typego] !== jsonResult.acc ) {
//				array.pushIfNotExist( jsonResult.acc, function(e) { 
//					return e === jsonResult.acc; 
//				});
//			}
//			callback();
//		}
//	});
//	
//}

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

