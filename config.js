var nconf = require("nconf");

function config( file ) {

	if ( ! file ) {
		file = "config.json"; // Default file
	}

	nconf.argv().env("_");
	var environment = nconf.get("NODE:ENV") || nconf.file( "default", file );
}

config.prototype.get = function( key ) {
	return nconf.get(key);
}

module.exports =  function ( fileinit ) {
	return new config( fileinit );
}
