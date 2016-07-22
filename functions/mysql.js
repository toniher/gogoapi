var mysqlqueries = require('./mysql.js');
var mysql = require('mysql');
var async = require('async');
var functions = require('./index.js');

exports.getPool = function( config, callback ) {

	var pool  = mysql.createPool({
		host     : config.mysql.host,
		user     : config.mysql.user,
		password : config.mysql.password,
		database : config.mysql.database,
		multipleStatements: true
	});

	callback( pool );

};

exports.getUniProt = function( pool, listitem, res, callback ) {

	var mapping = {};

	pool.getConnection(function(err, connection) {

		if ( ! err ) {
			
			var queryArr = [];
			var resultArr = [];
			async.each( listitem, function( item, cb ) {

				queryArr.push( 'select uniprot from idmapping where uniprot = '+ connection.escape(item)+' or external = '+ connection.escape(item)+ ' limit 1' );
				cb();
			}, function( err ) {
				connection.query( queryArr.join(";"), function(err, results) {
					if ( err ) {
						functions.sendError( connection, res, err );
						connection.release();
					}
					else {
						async.each( results, function( result, rcb ) {
							if ( result.length > 0 ) {
								resultArr.push( result[0]);
							} else {
								resultArr.push( null );
							}
							rcb();
						}, function ( err ) {
							for ( var i = 0; i < listitem.length + 1; i ++ ) {
								mapping[ listitem[ i ] ] = resultArr[ i ]["uniprot"];
							}
							callback( mapping );
							connection.release();
						});
					}
				});
			});

		} else {
			functions.sendError( res, err );
		}
	});

};

exports.getTaxID = function( pool, listitem, listID, res, callback ) {
	
	pool.getConnection(function(err, connection) {
	
		if ( ! err ) {
	
			var sql = 'SELECT distinct(a.TAXON) from goataxon a where a.`UniProtKB-AC` = ' + connection.escape(listitem);
			connection.query( sql, function(err, rows) {

				if ( !err ) {
					
					if ( rows.length === 0 ) {
						var sql2 = 'SELECT distinct(a.TAXON) from goataxon a, idmapping i where a.`UniProtKB-AC` = i.`UniProtKB-AC` and i.ID=' + connection.escape(listitem);
						connection.query( sql2, function(err, rows) {

							if ( err ) {
								functions.sendError( connection, res, err );
								connection.release();
							} else {
  
							  async.each( rows , function( row, cmysql ) {
								  if ( row.hasOwnProperty('TAXON') ) {
									  listID.push(  row.TAXON );
								  }
								  cmysql();
							  }, function( err ) {
								  callback();
								  connection.release();
							  });
						  }
						});
					} else {
  
						async.each( rows , function( row, cmysql ) {
							if ( row.hasOwnProperty('TAXON') ){
								listID.push(  row.TAXON );
							}
							cmysql();
						}, function( err ) {
							callback();
							connection.release();

						});
					}

				} else {
					functions.sendError( res, err );
					connection.release();
				}
	
				
				// Don't use the connection here, it has been returned to the pool.
			});
		} else {
			functions.sendError( res, err );
		}
	});

};


exports.getGO = function( pool, item, listGO, listdesc, res, callback ) {

	pool.getConnection(function(err, connection) {

		if ( ! err ) {

			// First we check whether this exists in goassociation, if so, we are done.
			var sql = 'SELECT distinct(a.GO), t.term_type, t.name from goassociation a, term t where t.acc=a.GO AND a.`ID` = ' + connection.escape(item);
			var sql2 = 'SELECT distinct(a.GO), t.term_type, t.name from goassociation a, term t, idmapping i where t.acc=a.GO AND a.`ID` = i.`UniProtKB-AC` and i.ID=' + connection.escape(item);
	
			connection.query(sql, function(err, results) {

				if ( err ) {
					functions.sendError( res, err );
					connection.release();
				} else {
		
					var golist = [];
			
					if ( results.length === 0 ) {
		
						connection.query(sql2, function(err, results) {
		
							if ( err ) {
								functions.sendError( res, err );
								connection.release();
							} else {
				
								var golist = [];
		
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
										connection.release();
									});
				
								} else {
									// Temporary sendError
									functions.sendError( res, err );
									connection.release();
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
						connection.release();
					}
				}
		
			});

		} else {
			functions.sendError( res, err );
		}

	});

};

