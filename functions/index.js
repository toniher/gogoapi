var functions = require('./index.js');

// We assume already JSON work
exports.getRequest = function( urlinput ) {

	var reqopts = {
		url: urlinput,
		headers: {
			'User-Agent': 'request',
			'Accept' : 'application/json'
		}
	};
	return reqopts;
};

// We assume already XML work
exports.getRequestXML = function( urlinput ) {

	var reqopts = {
		url: urlinput,
		headers: {
			'User-Agent': 'request',
			'Accept' : 'application/xml'
		}
	};
	return reqopts;
};

// Here we control the output, either in JSON or JSONP
exports.returnJSON = function( res, object ) {

	// If configured JSONP
	if ( res.app.set('config').jsonp ) {
		res.jsonp( object );
	} else {
		res.set( 'Content-Type', 'application/json' );
		res.send( object );
	}
};

exports.addPropFirst = function( data, param, value, callback ) {

	if ( param && value ) {
		data[0][param] = value;
	}
	callback( data );
}

exports.addProp = function( data, param, value, callback ) {

	if ( param && value ) {
		data[param] = value;
	}
	callback( data );
}

exports.sendError = function( res, err ) {

	//connection.end();
	var outcome = {};
	
	// Allowing other error msgss
	err = typeof err !== 'undefined' ? err : "Error!";
	
	outcome.status = "Error"
	outcome.text =  err;
	functions.returnJSON( res, outcome );
};

exports.capitaliseFirstLetter = function( string ) {
	return string.charAt(0).toUpperCase() + string.slice(1);
};


// http://www.geeksforgeeks.org/print-all-possible-combinations-of-r-elements-in-a-given-array-of-size-n/
// The main function that prints all combinations of size r
// in arr[] of size n. This function mainly uses combinationUtil()
exports.printCombination = function(arr, r, repo) {
	// A temporary array to store all combination one by one
	var data = new Array(r);
	var n = arr.length;
		
	if ( n > 0) {
		// Print all combination using temprary array 'data[]'
		combinationUtil(arr, data, 0, n-1, 0, r, repo);
	}
};
 
/* arr[]  ---> Input Array
   data[] ---> Temporary array to store current combination
   start & end ---> Staring and Ending indexes in arr[]
   index  ---> Current index in data[]
   r ---> Size of a combination to be printed */
function combinationUtil( arr, data, start, end, index, r, repo ) {

	// Current combination is ready to be printed, print it
	if (index === r) {
		
		var temp = [];
		for (j=0; j<r; j++) {
			temp.push( data[j] );
		}
		repo.push( temp );

		return;
	}
	
	// replace index with all possible elements. The condition
	// "end-i+1 >= r-index" makes sure that including one element
	// at index will make a combination with remaining elements
	// at remaining positions
	for ( var i=start; i<=end && end-i+1 >= r-index; i++ ) {
		data[index] = arr[i];
		combinationUtil(arr, data, i+1, end, index+1, r, repo);
	}
};


