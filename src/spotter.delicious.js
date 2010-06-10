/**
 * spotter.delicious.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: implement tag feed, should be very easy
 * TODO: implement hotlist feed, should be very easy
 *
 */

if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.util)
    throw new Error("spotter.util not yet loaded!");

if(!spotter.modules) spotter.modules = {};
else if(typeof spotter.modules != "object")
    throw new Error("spotter.modules is not an object!");

if(!spotter.modules.delicious) spotter.modules.delicious = {};
else if(typeof spotter.modules.delicious != "object")
    throw new Error("spotter.modules.delicious is not an object!");

spotter.modules.delicious.recent = function(options)  {
    var lastTop;
    var url = function()  {
	var url = 'http://feeds.delicious.com/v2/json/recent/?count=100';
	return url;
    }

    var process = function(data)  {
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

    return {url:url, process:process};
    
}