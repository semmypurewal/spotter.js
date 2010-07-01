/**
 * spotter.identica.js
 * Copyright (C) 2010 Semmy Purewal
 *
 */

if(!com.yellowsocket.spotter)
    throw new Error("com.yellowsocket.spotter not yet loaded!");

if(!com.yellowsocket.spotter.util)
    throw new Error("com.yellowsocket.spotter.util not yet loaded!");

if(!com.yellowsocket.spotter.modules) com.yellowsocket.spotter.modules = {};
else if(typeof com.yellowsocket.spotter.modules != "object")
    throw new Error("com.yellowsocket.spotter.modules is not an object!");

if(!com.yellowsocket.spotter.modules.identica) com.yellowsocket.spotter.modules.identica = {};
else if(typeof com.yellowsocket.spotter.modules.identica != "object")
    throw new Error("com.yellowsocket.spotter.modules.identica is not an object!");

/**
 * Required options: searchString
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the tweet objects themselves
 *
 * TODO: Once statusnet completely implements its Twitter Compatible API
 *       this should work just like the twitter module.  It may be possible
 *       to merge the two modules somehow.
 */
com.yellowsocket.spotter.modules.identica.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.searchString;

    var lastID = 0;  //this is a temporary fix until since_id is properly implemented

    if(searchString === undefined || searchString === "")
	throw new Error("identica search module requires searchString to be specified as an option");

    this.url = function()  {
	var url = 'http://identi.ca/api/search.json';
	url += refreshURL != ""?refreshURL:'?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var i;

	processedData.data = [];
	refreshURL = rawData.refresh_url;

	if(rawData.results.length>0)  {
	    processedData.update = true;
	    for(i = 0; i < rawData.results.length && rawData.results[i].id > lastID; ++i)  {
		processedData.data.unshift(rawData.results[i]);
	    }
	    lastID = rawData.results[0].id;
	}
	else  {
	    processedData.update = false;
	}

	return processedData;;
    }
};

com.yellowsocket.spotter.modules.identica.realtimesearch = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var searchString = options.searchString;
    var lastID = 0;  //this is a temporary fix until since_id is properly implemented
    var currentCount=1000;
    var counts = [0,0,currentCount];

    if(searchString === undefined || searchString === "")
	throw new Error("identica search module requires searchString to be specified as an option");

    this.url = function()  {
	var url = 'http://identi.ca/api/statuses/public_timeline.json?count='+currentCount;
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var i;

	if(lastID > 0)  {
	    counts.push(rawData[0].id-lastID);
	    counts.shift();
	    currentCount = Math.ceil((counts[0]+counts[1]+counts[2])/3)+10;
	}

	processedData.data = [];

	if(rawData.length>0)  {
	    for(i = 0; i < rawData.length && rawData[i].id > lastID; ++i)  {
		if(rawData[i].text.match(new RegExp(searchString,"i")))  {
		    processedData.data.unshift(rawData[i]);
		}
	    }
	    lastID = rawData[0].id;
	    processedData.update = processedData.data.length===0?false:true;
	}
	else  {
	    processedData.update = false;
	}
	return processedData;;
    }
}