/**
 * spotter.twitter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: test trend module more carefully
 *
 */

if(!com.yellowsocket.spotter)
    throw new Error("com.yellowsocket.spotter not yet loaded!");

if(!com.yellowsocket.spotter.util)
    throw new Error("com.yellowsocket.spotter.util not yet loaded!");

if(!com.yellowsocket.spotter.modules) com.yellowsocket.spotter.modules = {};
else if(typeof com.yellowsocket.spotter.modules != "object")
    throw new Error("com.yellowsocket.spotter.modules is not an object!");

if(!com.yellowsocket.spotter.modules.twitter) com.yellowsocket.spotter.modules.twitter = {};
else if(typeof com.yellowsocket.spotter.modules.twitter != "object")
    throw new Error("com.yellowsocket.spotter.modules.twitter is not an object!");

/**
 * Required options: q
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the new tweet objects themselves
 */
com.yellowsocket.spotter.modules.twitter.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.q;
    var exclude = (options.exclude !== undefined)?options.exclude.split(","):[];
    var i;
    var excludeREString = "";



    if(searchString === undefined || searchString === "")
	throw new Error("twitter search module requires a search string (q) to be specified as an option");
    
    if(!frequency) frequency = MAX_FREQUENCY;  //if not defined, we can do more sophisticated polling

    if(exclude !== undefined)  {
	for(i=0;i < exclude.length; i++)  {
	    if(exclude[i] === "twitpic"||
	       exclude[i] === "tweetphoto")  {
		excludeREString += (excludeREString==="")?exclude[i]:"|"+exclude[i];
	    }
	    else  {
		throw new Error(exclude[i] + " not a valid exclude string, try 'tweetphoto' and/or 'twitpic'");
	    }
	}
    }


    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += (refreshURL !== "")?refreshURL:'?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	refreshURL = rawData.refresh_url || "";

	if(excludeREString === "")  {
	    processedData.data = rawData.results;
	}
	else  {
	    processedData.data = [];
	    //create re

	    var excludeRE = new RegExp(excludeREString);
	    //filter the data
	    for(i in rawData.results)  {
		if(rawData.results[i].text.match(excludeRE) === null)  {
		    processedData.data.push(rawData.results[i]);
		}
		else  {
		    //alert("filtered:"+rawData.results[i].text);
		}
	    }
	}

	processedData.update = (processedData.data.length>0)?true:false;

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
com.yellowsocket.spotter.modules.twitter.trends = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

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
	    var tempArray = com.yellowsocket.spotter.util.complements(rawData.trends, lastTrends);
	    processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	}
	lastTrends = rawData.trends;
	processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	return processedData;
    }
}