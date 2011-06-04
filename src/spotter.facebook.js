/**
 * spotter.facebook.js
 * Copyright (C) 2010 Semmy Purewal
 *
 */

if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.util)
    throw new Error("spotter.util not yet loaded!");

if(!spotter.modules) spotter.modules = {};
else if(typeof spotter.modules != "object")
    throw new Error("spotter.modules is not an object!");

if(!spotter.modules.facebook) spotter.modules.facebook = {};
else if(typeof spotter.modules.facebook != "object")
    throw new Error("spotter.modules.facebook is not an object!");

/**
 * Required options: q
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the new tweet objects themselves
 */
spotter.modules.facebook.search = function(options)  {
    spotter.modules.Module.call(this,options);

    var searchString = options.q;
    var lastCreatedTime = null;
    var i;

    if(searchString === undefined || searchString === "")
	throw new Error("facebook search module requires a search string (q) to be specified as an option");
    
    this.url = function()  {
	var url = 'http://graph.facebook.com/search'
	url += '?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};

	//alert(lastCreatedTime);

	processedData.data = [];
	//filter the data
	for(i in rawData.data)  {
	    if((lastCreatedTime === null || rawData.data[i].created_time > lastCreatedTime) && rawData.data[i].type === 'status')  {
		rawData.data[i].profile_image_url = "http://graph.facebook.com/"+rawData.data[i].from.id+"/picture";
		rawData.data[i].profile_url = "http://www.facebook.com/people/"+rawData.data[i].from.name.replace(" ","-")+"/"+rawData.data[i].from.id;
		processedData.data.push(rawData.data[i]);
	    }
	    else  {
		//alert("filtered:"+rawData.data.results[i].text);
	    }
	}


	lastCreatedTime = rawData.data[0]['created_time'];

	processedData.update = (processedData.data.length>0)?true:false;

	return processedData;;
    }
};