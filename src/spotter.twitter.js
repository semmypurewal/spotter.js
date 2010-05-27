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

/**
 * Required options: searchString
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the tweet objects themselves
 */
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

    var callback = function(rawData)  {
	var processedData = {};
	refreshURL = rawData.refresh_url;
	processedData.update = (rawData.results.length>0)?true:false;
	processedData.data = rawData.results;
	return processedData;;
    }

    var module = {};
    module.url = url;
    module.callback = callback;
    return module;
};


/**
 * Required options:
 * Other available options: exclude:hashtags
 * callback return format: {added,removed,trends}
 * added: new trends since the last call
 * removed: removed trends since the last call
 * trends: all trends
 */
spotter.modules.twitter.trends = function(options)  {
    var lastTrends;

    var url = function()  {
	var url = "http://search.twitter.com/trends.json?";
	if(options != undefined && options.exclude != undefined) url+="exclude="+options.exclude;
	return url;
    }

    var callback = function(rawData)  {
	var processedData = {};
	var trends = rawData.trends;
	if(lastTrends == null)
	    processedData = {data:{"added":rawData.trends, "removed":{}, "trends":rawData.trends}};
	else  {
	    var tempArray = complements(rawData.trends, lastTrends);
	    processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	}
	lastTrends = rawData.trends;
	processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	return processedData;
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