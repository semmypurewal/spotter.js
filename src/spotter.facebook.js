/**
 * spotter.facebook.js
 * Copyright (C) 2010-2011 Semmy Purewal
 */

(function(window, name)  {
    var spotterjs = window.spotterjs;

    if(!spotterjs)  {
	throw new Error("spotter not yet loaded!");
    }
    
    if(!spotterjs || !spotterjs.verify)  {
	throw new Error("problem with spotter.js file!");
    }
    spotterjs.verify(['util','modules']);
    var ns = spotterjs.namespace(name);

    /**
     * Required options: q
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new tweets
     * data: the new tweet objects themselves
     */
    ns.search = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
	var searchString = options.q;
	var lastCreatedTime = null;
	var i;
	
	if(searchString === undefined || searchString === "")  {
	    throw new Error("facebook search module requires a search string (q) to be specified as an option");
	}
	
	this.url = function()  {
	    var url = 'http://graph.facebook.com/search';
	    url += '?q='+escape(searchString);
	    return url;
	};

	this.process = function(rawData)  {
	    var processedData = {};
	    processedData.data = [];
	    //filter the data
	    for(i in rawData.data)  {
		if((lastCreatedTime === null || rawData.data[i].created_time > lastCreatedTime) && rawData.data[i].message !== undefined)  {
		//if((lastCreatedTime === null || rawData.data[i].created_time > lastCreatedTime))  {
		    rawData.data[i].profile_image_url = "http://graph.facebook.com/"+rawData.data[i].from.id+"/picture";
		    rawData.data[i].profile_url = "http://www.facebook.com/people/"+rawData.data[i].from.name.replace(" ","-")+"/"+rawData.data[i].from.id;
		    processedData.data.push(rawData.data[i]);
		}
	    }

	    lastCreatedTime = rawData.data[0].created_time;

	    processedData.update = (processedData.data.length>0)?true:false;

	    return processedData;
	};
    };
})(window, "facebook");
