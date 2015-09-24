var neo4j = require("neo4j");

exports.getInfobyField = function( server, label, predicate, cb ) {

    var db = new neo4j.GraphDatabase( server );
    
    // convenient query
    restrictPredicate = procPredicate( predicate );
    
    var cypher = "MATCH (n:"+label+restrictPredicate+") RETURN n";
    
    executeCypher( db, cypher, cb ); 

};

exports.getInfobyFieldArray = function( server, label, array, cb ) {
    
    var db = new neo4j.GraphDatabase( server );

    // Cypher query
    var cypher = "MATCH (n:TAXID) "
    
    var whereArr = [];
    var keys = Object.keys( array );
    for ( var k=0; k < keys.length; k = k + 1 ) {
        
        var prop = keys[k];
        if ( array.hasOwnProperty( prop ) ) {
            
            var whereStr = " ANY ( x IN "+arrayProp( array[prop] )+" WHERE x in n."+prop+" )";
            whereArr.push( whereStr );
        }
    }
    
    if ( whereArr.length > 0 ) {
        
        cypher = cypher + " WHERE ( ";
        cypher = cypher + whereArr.join(" AND ");
        cypher = cypher + " ) RETURN n ";
                
        executeCypher( db, cypher, cb ); 
        
    } else {
    
        cb(null, [] );
    }

};

function executeCypher( db, query, cb ) {

    db.cypher( { query: query }, function(err, objs) {

        if (err) {
            cb( err, null );   
        }
        else {
            if ( objs.length > 0 ) {
                
                var outcome = [];
                
                for ( var o = 0; o < objs.length; o = o + 1) {
                    
                    if ( objs[o].hasOwnProperty("n") ) {
                                            
                        if ( objs[o]["n"].hasOwnProperty("properties") ) {
                            
                            outcome.push( objs[o]["n"]["properties"] );
                        }
                    }
                }
                
                cb( null, outcome );
                
            } else {
                cb( null, [] );
            } 
        }
    });
}


function arrayProp( array ) {
    
    var str = "[";
    
    str = str + array.join(",");
    
    str = str + "]";
    return str;
    
}

function procPredicate( predicate ) {

    var str = "{";

    var arrStr = [];
    
    var keys = Object.keys( predicate );
    for ( var k=0; k < keys.length; k = k + 1 ) {
        var prop = keys[k];
        if ( predicate.hasOwnProperty( prop ) ) {
            
            var kstr = prop + ":";
            if ( predicate[prop] === parseInt(predicate[prop], 10) || predicate[prop] === parseFloat(predicate[prop], 10)) {
                kstr = kstr + predicate[prop];
            } else {
                kstr = kstr + "\"" + predicate[prop] + "\"" ;
            }
            arrStr.push( kstr );
        
        }
    }
    
    str = str + arrStr.join(",");
    str = str + "}";

    return str;
}
