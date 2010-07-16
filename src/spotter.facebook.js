/**
 * spotter.facebook.js
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

if(!com.yellowsocket.spotter.modules.facebook) com.yellowsocket.spotter.modules.facebook = {};
else if(typeof com.yellowsocket.spotter.modules.facebook != "object")
    throw new Error("com.yellowsocket.spotter.modules.facebook is not an object!");

/**
 * Required options: q
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the new tweet objects themselves
 */
com.yellowsocket.spotter.modules.facebook.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var searchString = options.q;
    var lastId = null;
    var i;

    if(searchString === undefined || searchString === "")
	throw new Error("facebook search module requires a search string (q) to be specified as an option");
    
    if(!frequency) frequency = MAX_FREQUENCY;  //if not defined, we can do more sophisticated polling

    this.url = function()  {
	var url = 'http://graph.facebook.com/search'
	url += '?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	lastId = rawData.data[0].id || "";

	if(lastId === "" | lastId === null)  {
	    processedData.data = rawData.data;
	}
	else  {
	    processedData.data = [];
	    //filter the data
	    for(i in rawData.data)  {
		if(lastId === "" || rawData.data[i].id > lastId)  {
		    processedData.data.push(rawData.data[i]);
		}
		else  {
		    //alert("filtered:"+rawData.data.results[i].text);
		}
	    }
	}

	processedData.update = (processedData.data.length>0)?true:false;

	return processedData;;
    }
};