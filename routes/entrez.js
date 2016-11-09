var functions = require('../functions/index.js');
var taxon = require('../routes/taxon.js');
var request = require('request');
var async = require("async");

exports.getTaxonId = function(req, res) {

	var config = req.app.set('config');

	var db = req.params.db;
	var acc = req.params.id;

	var session = "&tool="+config.entrez.tool+"&email="+config.entrez.email;

	// JSON Directly
	var query = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db="+db+"&id="+acc+"&retmode=json&version=2.0"+session;

	request( functions.getRequest( query ), function (error, response, body) {
		if (!error && response.statusCode === 200) {
	
			var result = JSON.parse( body );

			if ( result.result && result.result.uids.length === 0 ) {
			
				functions.returnJSON( res, { "msg": "No results!", "acc":acc });
				return true;
			
			} else {

				if ( result.result.uids.length > 0 ) {

					// We should iterate here
					var listorgs = [];

					async.eachSeries( result.result.uids, function( entry, callback ){
						
						var org = result.result[entry].taxid;
						
						// From this we should search organism by name
						taxon.getTaxInfo( config.neo4j.server, org, function( data ) {
							// We put original accession and let's have fun
							functions.addProp( data, "acc", entry, function( output ) {
								listorgs.push( output );
								callback();
							}); 
						});
					},
					function( err ) {
						functions.returnJSON( res, listorgs);
					});
					
					return true;
				}
				
				functions.returnJSON( res, { "msg": "No results!", "acc":acc });
				return true;
			}

		} else {

			var outcome = {};
			outcome.msg = "Error!";
			functions.returnJSON( res, outcome);
			return true;
		}
		
		return true;
	
	});

};


