/**
 * spotter.facebook.js
 * Copyright (C) 2010 Semmy Purewal
 *
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotter not yet loaded!");
    
    if(!spotterjs.util)
	throw new Error("spotter.util not yet loaded!");

    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");
    
    if(!spotterjs.modules.facebook) spotterjs.modules.facebook = {};
    else if(typeof spotterjs.modules.facebook != "object")
	throw new Error("spotterjs.modules.facebook is not an object!");

    /**
     * Required options: q
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new tweets
     * data: the new tweet objects themselves
     */
    spotterjs.modules.facebook.search = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
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
    }
})(window);