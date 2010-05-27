/**
 * spotter.delicious.js
 * Copyright (C) 2010 Semmy Purewal
 */

if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.modules) spotter.modules = {};
else if(typeof spotter.modules != "object")
    throw new Error("spotter.modules is not an object!");

if(!spotter.modules.delicious) spotter.modules.delicious = {};
else if(typeof spotter.modules.delicious != "object")
    throw new Error("spotter.modules.delicious is not an object!");

spotter.modules.delicious.recent = function(options)  {
    var url = function()  {
	var url = 'http://feeds.delicious.com/v2/json/recent/?';
	return url;
    }

    var callback = function(data)  {
	return {data:data, update:true}
    }
    
    var module = {};
    module.url = url;
    module.callback = callback;
    return module;
}