var nconf = require("nconf");

function config( file ) {

	if ( ! file ) {
		file = "config.json"; // Default file
	}

	nconf.file( "default", file );

}

config.prototype.get = function( key ) {
	return nconf.get(key);
}

module.exports =  function ( fileinit ) {
	return new config( fileinit );
}
