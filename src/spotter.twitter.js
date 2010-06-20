/**
 * spotter.twitter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: test trend module more carefully
 *
 */

if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.util)
    throw new Error("spotter.util not yet loaded!");

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
 * data: the new tweet objects themselves
 */
spotter.modules.twitter.search = function(options)  {
    spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.searchString;

    if(searchString === undefined || searchString === "")
	throw new Error("twitter search module requires searchString to be specified as an option");
    
    if(!frequency) frequency = MAX_FREQUENCY;  //if not defined, we can do more sophisticated polling

    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += (refreshURL !== "")?refreshURL:'?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	refreshURL = rawData.refresh_url;
	processedData.update = (rawData.results.length>0)?true:false;
	processedData.data = rawData.results;
	return processedData;;
    }

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
    spotter.modules.Module.call(this,options);

    var lastTrends;

    this.url = function()  {
	var url = "http://search.twitter.com/trends.json?";
	if(options != undefined && options.exclude != undefined) url+="exclude="+options.exclude;
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var trends = rawData.trends;
	if(lastTrends === null)  {
	    processedData = {data:{"added":rawData.trends, "removed":{}, "trends":rawData.trends}};
	}
	else  {
	    var tempArray = spotter.util.complements(rawData.trends, lastTrends);
	    processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	}
	lastTrends = rawData.trends;
	processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	return processedData;
    }
}