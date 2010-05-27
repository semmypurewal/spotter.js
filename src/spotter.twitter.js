/**
 * spotter.twitter.js
 * Copyright (C) 2010 Semmy Purewal
 */

if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.modules) spotter.modules = {};
else if(typeof spotter.modules != "object")
    throw new Error("spotter.modules is not an object!");

if(!spotter.modules.twitter) spotter.modules.twitter = {};
else if(typeof spotter.modules.twitter != "object")
    throw new Error("spotter.modules.twitter is not an object!");

spotter.modules.twitter.search = function(options)  {
    var refreshURL = "";
    var searchString = options.searchString;

    if(searchString == undefined || searchString == "")
	throw new Error("twitter search module requires searchString to be specified as an option");

    var url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += refreshURL != ""?refreshURL:'?q='+escape(searchString);
	return url;
    }

    var callback = function(data)  {
	refreshURL = data.refresh_url;
	if(data.results.length > 0) data.results.update=true;
	return data.results;
    }

    var module = {};
    module.url = url;
    module.callback = callback;
    return module;
};

spotter.modules.twitter.trends = function(options)  {
    var lastTrends;

    var url = function()  {
	var url = "http://search.twitter.com/trends.json?";
	if(options != undefined && options.exclude != undefined) url+="exclude="+options.exclude;
	return url;
    }

    var callback = function(data)  {
	var trends = data['trends'];
	if(lastTrends == null)
	    result = {"added":trends, "removed":{}, "trends":trends};
	else  {
	    var tempArray = complements(trends, lastTrends);
	    var changeArray = changes(trends, lastTrends);
	    result = {"added":tempArray[0],"removed":tempArray[1], "trends":trends, "changes":changeArray};
	}
	lastTrends = trends;
	if(result['added'].length > 0 || result['removed'].length > 0) result.update=true;
	return result;
    }


    /********** 'PRIVATE' HELPER FUNCTIONS ***************/
	
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
    function changes(a,b)  {
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
    function complements(a, b)  {
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
    
    
    var module = {};
    module.url = url;
    module.callback = callback;
    return module;
}