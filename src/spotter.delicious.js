/**
 * spotter.delicious.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: implement hotlist feed, should be very easy
 *
 */

if(!com.yellowsocket.spotter)
    throw new Error("spotter not yet loaded!");

if(!com.yellowsocket.spotter.util)
    throw new Error("spotter.util not yet loaded!");

if(!com.yellowsocket.spotter.modules) com.yellowsocket.spotter.modules = {};
else if(typeof com.yellowsocket.spotter.modules != "object")
    throw new Error("spotter.modules is not an object!");


if(!com.yellowsocket.spotter.modules.delicious)
    com.yellowsocket.spotter.modules.delicious = {};
else if(typeof com.yellowsocket.spotter.modules.delicious != "object")
    throw new Error("com.yellowsocket.spotter.modules.delicious is not an object!");


com.yellowsocket.spotter.modules.delicious.recent = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var lastTop;
    this.url = function()  {
	var url = 'http://feeds.delicious.com/v2/json/recent/?count=100';
	return url;
    }

    this.process = function(data)  {
	var processedData = {};
	if(lastTop === undefined)  {
	    lastTop = data[0];
	    processedData = {data:data, update:true};
	}
	else if(lastTop["u"] === data[0]["u"])  {
	    processedData = {data:data, update:false};
	}
	else  {
	    pops = data.length - find(lastTop, data);
	    for(var i = 0; i < pops; i++) data.pop();
	    processedData = {data:data, update:true};
	    lastTop = data[0];
	}
	return processedData;
    }

    var find = function (item, array)  {
	for(var i = 0; i < array.length; ++i)  {
	    if(array[i]["u"] === item["u"]) return i;
	}
	return array.length;
    }
}//end recent module

/**
 * Required options: tags
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new bookmarks
 * data: the bookmark objects themselves
 *
 * @constructor
 */
com.yellowsocket.spotter.modules.delicious.tags = function(options)  {
    spotter.modules.Module.call(this,options);

    var tags = options.tags;

    if(tags === undefined || tags === "")
	throw new Error("delicious tags module requires tags to be specified as an option");	

    var lastTop;

    this.url = function()  {
	var url = 'http://feeds.delicious.com/v2/json/tag/'+tags+'?count=100';
	return url;
    }

    /**
     * process delicious data
     *
     * @param data This is the raw data from Spotter
     */
    this.process = function(data)  {
	var processedData = {};
	if(lastTop === undefined)  {
	    lastTop = data[0];
	    processedData = {data:data, update:true};
	}
	else if(lastTop["u"] === data[0]["u"])  {
	    processedData = {data:data, update:false};
	}
	else  {
	    pops = data.length - find(lastTop, data);
	    for(var i = 0; i < pops; i++) data.pop();
	    processedData = {data:data, update:true};
	    lastTop = data[0];
	}
	return processedData;
    }

    var find = function (item, array)  {
	for(var i = 0; i < array.length; ++i)  {
	    if(array[i]["u"] === item["u"]) return i;
	}
	return array.length;
    }

}