/**
 * spotter.twitter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: test trend module more carefully
 *
 */

(function(window, name)  {
    var spotterjs = window.spotterjs;
    
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
     * data: the new tweet objects themselves (if any)
     */
    ns.search = function(options)  {
	spotterjs.modules.Module.call(this,options);

	var refreshURL = "";
	var searchString = options.q;
	var exclude = (options.exclude !== undefined)?options.exclude.split(","):[];
	var lang = options.lang;
	var i;
	var excludeREString = "";
	var base = "";

	this.verifyOptions(['q'], options);
	
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

	this.baseURL = function(b)  {
	    if(b && typeof b === "string")  {
		base = b;
	    }
	    else  {
		return base;
	    }
	};
	this.baseURL('http://search.twitter.com/search.json');

	this.url = function()  {
	    var url = this.baseURL();
	    url += (refreshURL !== "")?refreshURL:'?q='+escape(searchString);
	    url += (lang)?'&lang='+lang:'';
	    return url;
	};
	
	this.process = function(rawData)  {
	    var processedData = {};
	    refreshURL = rawData.refresh_url || "";
	    
	    if(excludeREString === "")  {
		processedData.data = rawData.results;
	    }
	    else  {
		processedData.data = [];
		var excludeRE = new RegExp(excludeREString);
		//filter the data
		for(i in rawData.results)  {
		    if(rawData.results[i].text.match(excludeRE) === null)  {
			processedData.data.push(rawData.results[i]);
		    }
		}
	    }

	    processedData.update = (processedData.data.length>0)?true:false;

	    return processedData;
	};
    };


    /**
     * Required options:
     * Other available options: exclude:hashtags
     * callback return format: {added,removed,trends}
     * added: new trends since the last call
     * removed: removed trends since the last call
     * trends: all trends
     */
    ns.trends = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
	var lastTrends;
	
	this.url = function()  {
	    var url = "http://api.twitter.com/trends.json?";
	    if(options !== undefined && options.exclude !== undefined) { 
		url+="exclude="+options.exclude;
	    }
	    return url;
	};
	
	this.process = function(rawData)  {
	    var processedData = {};
	    var trends = rawData.trends;
	    if(lastTrends === null)  {
		processedData = {data:{"added":rawData.trends, "removed":{}, "trends":rawData.trends}};
	    }
	    else  {
		var tempArray = spotterjs.util.complements(rawData.trends, lastTrends);
		processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	    }
	    lastTrends = rawData.trends;
	    processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	    return processedData;
	};
    };
})(window, "twitter");
