var express = require("express");

var args = process.argv.slice(2);

// Assuming first arg is a conf.js file
var nconfig = require('./config.js')(args[0]);
var config = nconfig.get("express");
var errorhandler = require("errorhandler");
var bodyParser = require('body-parser');
var compression = require('compression');
var cors = require('cors');

var app = express();

var basepath = "";

if (config.basepath) {
	basepath = config.basepath;
}

// Enable JSONP
if ( config.jsonp ) {
	app.set("jsonp callback", true);
}

// Enable CORS
if ( config.cors ) {
	
	var corsOptions = {};
	
	if ( config['cors-whitelist'] && config['cors-whitelist'].length > 0 ) {
		corsOptions = {
		  origin: function(origin, callback){
			var originIsWhitelisted = config['cors-whitelist'].indexOf(origin) !== -1;
			callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
		  }
		};
	}
	
	app.use( cors( corsOptions ) );
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Config
app.use(errorhandler({ dumpExceptions: true, showStack: true }));

// Compression
app.use(compression({
  threshold: 512
}));

app.set("config", config);


var functions = require('./functions/index.js');
var go = require('./routes/go.js');
var taxon = require('./routes/taxon.js');
var entrez = require('./routes/entrez.js');


app.get( basepath, function (req, res) {

	var help = {};

	help.description = "Express RESTFul interface for providing information about GO and Taxonomy";
	help.examples = [
		[ "/species/Dog", "retrieves entries about dogs" ],
		[ "/taxon/9606", "retrieves organism by NCBI taxonomy ID" ],
		[ "/taxon/9606/rank", "get all taxonomic ranks." ],
		[ "/taxon/9606/rank/family", "retrieves the value of the associated taxonomic rank." ],
		[ "/taxon/common/9606-10090", "retrieves common clade between two organisms ID" ],
		[ "/taxon/list/P08819", "retrieves all associated taxonomy info of a protein" ],
		[ "/taxon/commonlist/P08819-P15169", "retrieves all common clade between two or more proteins" ],
		[ "/taxon/entrez/protein/21224458", "retrieves taxon information about entry via NCBI Entrez" ],
		[ "/taxon/entrezxml/nuccore/3282736", "retrieves taxon information about entry via NCBI Entrez - Using XML" ],
		[ "/go/GO:0005615", "retrieves info about GO entry" ],
		[ "/go/common/GO:0005615-GO:0005576", "retrieves ancestor between two GO entries" ],
		[ "/go/list/P08819", "retrieves all associated GO annotations of a protein" ],
		[ "/go/commonlist/P08819-P15169", "retrieves all common GO information between two proteins" ],
	];

	functions.returnJSON( res, help);
});

// Gene Ontology

// Get GO ID information
app.get( basepath+'/go/:id', go.getId );
// Get common between list of ID
app.get( basepath+'/go/common/:list', go.getCommon );

// Lists GO elements of associated to one or several proteins
app.get( basepath+'/go/list/:list',  go.getListUniProt );
app.get( basepath+'/go/list/:list/:common',  go.getListUniProt );
app.get( basepath+'/go/list/:list/:common/:format',  go.getListUniProt );


// Taxonomy

// Look for TaxonID
app.get( basepath+'/taxon/:id', taxon.getId);

// Look for Taxon name in Neo4j
app.get( /\/species\/(.+)/, taxon.getSpecies );
app.get( /\/species2\/(.+)/, taxon.getSpeciesMySQL );


// Get common between list of ID
app.get( basepath+'/taxon/common/:list', taxon.getCommon );

// Lists taxon of associated to one or several proteins
app.get( basepath+'/taxon/list/:list', taxon.getListUniProt );
app.get( basepath+'/taxon/list/:list/:common', taxon.getListUniProt );
app.get( basepath+'/taxon/list/:list/:common/:format', taxon.getListUniProt );


// Get Rank information
app.get( basepath+'/taxon/:id/rank', taxon.getRankAll );
app.get( basepath+'/taxon/:id/rank/:rank', taxon.getRank );

// Entrez interface

// Lists taxon of associated protein
app.get( basepath+'/taxon/entrez/:db/:id', entrez.getTaxonId );

// Lists taxon of associated protein
app.get( basepath+'/taxon/entrezxml/:db/:id', entrez.getTaxonIdXML );


// Launch server
app.listen( config.port ); 

