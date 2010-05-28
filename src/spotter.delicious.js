/**
 * spotter.delicious.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: debug the process function, make sure it's finding
 *       the freshest bookmarks; curently too buggy; maybe move it to util
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
    var l;

    var url = function()  {
	var url = 'http://feeds.delicious.com/v2/json/recent/?';
	return url;
    }


    var callback = function(data)  {
	var processedData = {};
	if(l == undefined)  {
	    l = data[0];
	    processedData = {data:data, update:true};
	}
	else if(spotter.util.equals(data[0],l))
	    processedData = {data:data, update:false};
	else  {
	    pops = data.length-find(l, data);
	    for(var i = 0; i < pops; i++) data.pop;
	    processedData = {data:data, update:true};
	    l = data[0];
	}
	return processedData;
    }



    function find(object, array)  {
	for(i in array)
	    if(equals(array[i],object))
		return i;
	return array.length;
    }



    return {url:url, callback:callback};
    
}