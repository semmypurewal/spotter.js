if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.util) spotter.util = {};
else if(typeof spotter.util != "object")
    throw new Error("spotter.util is not an object!");

/**
 * Returns an array of integers that represent
 * the indices of the elements of b in the elements
 * of a.  Currently assumes these are trend objects.
 * Also assumes that all elements in a and b are uniq
 * (i.e. they are sets)
 *
 * For example
 *
 * a:      ["a","b","c","d"]
 * b:      ["c","b","d","f"]
 * result: [-1 , 1 , 0 , 2 ]  
 *
 * @param {Array} An array of length n
 * @param {Array} An array of length n
 *
 * TODO: make this more general
 * TODO: make this private
 */
spotter.util.changes = function(a,b)  {
    /*a = [{'name':'a'},{'name':'b'},{'name':'c'},{'name':'d'}];
      b = [{'name':'c'},{'name':'b'},{'name':'d'},{'name':'f'}];*/
    
    var result = new Array();
    var indices = new Object();
    for(var i in b)
	indices[b[i]]==undefined?indices[b[i]['name']]=parseInt(i):null;
    for(var i in a)
	result[i] = indices[a[i]['name']]==undefined?-1:indices[a[i]['name']];
    return result;
}

/**
 * returns an array of arrays.  the first
 * are the elements in a that are not in b
 * and the second are the elements in b that
 * are not in a.
 *
 * For now this assumes a trends object
 *
 * TODO: make private
 * TODO: make more general (for arbitrary arrays)
 * TODO: use the changes algorithm as a subroutine
 *
 */
spotter.util.complements = function(a, b)  {
    var counts = new Object();
    var aMinusB = new Array();
    var bMinusA = new Array();
    for(var i in a)
	counts[a[i]]==undefined?counts[a[i]['name']]=i:null;
    for(var j in b)
	counts[b[j]['name']]==null?bMinusA.push(b[j]):counts[b[j]['name']]=-1;
    for(var k in counts)
	counts[k] >= 0?aMinusB.push(a[counts[k]]):null;
    return [aMinusB,bMinusA];
}


/**
 * This is not currently working and should not be used anywhere
 */
spotter.util.equals = function(objA, objB)  {
    var result = true;
    if(typeof objA !== typeof objB || objA.length !== objB.length)
	result = false;
    else if(objA instanceof Object && objB instanceof Object)  {
	for(var i in objA)  {
	    if(!equals(objA[i],objB[i]))
		result = false;
	}
    }
    else if(objA != objB)
	result = false;
    return result;
}