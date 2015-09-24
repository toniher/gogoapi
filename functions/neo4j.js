var seraph = require("seraph");

exports.getInfobyField = function( server, label, predicate, cb ) {

    var db = seraph( server );
    
    // convenient query
    var matches = db.find( predicate, false, label, function (err, objs) {
        if (err) {
            cb( err, null );   
        }
        else {
            cb( null, objs );
        }
    });

};

exports.getInfobyFieldArray = function( server, label, array, cb ) {
    
    console.log( "HERE");
    var db = seraph( server );
    
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
    
    console.log( whereArr );
    
    if ( whereArr.length > 0 ) {
        
        cypher = cypher + " WHERE ( ";
        cypher = cypher + whereArr.join(" AND ");
        cypher = cypher + " ) RETURN n ";
        
        db.query(cypher, null, function(err, result) {
            if (err) {
                cb( err, null );   
            }
            else {
                cb( null, result );
            }
        });
        
    } else {
    
        cb(null, [] );
    }

};


function arrayProp( array ) {
    
    var str = "[";
    
    str = str + array.join(",");
    
    str = str + "]";
    return str;
    
}