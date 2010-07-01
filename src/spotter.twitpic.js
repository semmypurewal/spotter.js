/**
 * spotter.twitpic.js
 * Copyright (C) 2010 Semmy Purewal
 */

if(!com.yellowsocket.spotter)
    throw new Error("com.yellowsocket.spotter not yet loaded!");

if(!com.yellowsocket.spotter.util)
    throw new Error("com.yellowsocket.spotter.util not yet loaded!");

if(!com.yellowsocket.spotter.modules) com.yellowsocket.spotter.modules = {};
else if(typeof com.yellowsocket.spotter.modules != "object")
    throw new Error("com.yellowsocket.spotter.modules is not an object!");

if(!com.yellowsocket.spotter.modules.twitpic) com.yellowsocket.spotter.modules.twitpic = {};
else if(typeof com.yellowsocket.spotter.modules.twitpic != "object")
    throw new Error("com.yellowsocket.spotter.modules.twitpic is not an object!");

/**
 * Required options: searchString
 * Other available options: ?
 * callback return format: {update, data}
 *
 * There is no twitpic API, this is a modification of the 
 * twitter search API
 *
 * In addition to the normal twitter API response each object
 * includes the following:
 *
 * twitpic_url
 * twitpic_thumbnail_url
 * twitpic_mini_url
 *
 * update: true/false depending on whether there are new tweets
 * data: the tweet objects themselves
 */
com.yellowsocket.spotter.modules.twitpic.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.searchString;

    if(searchString === undefined || searchString === "")
	throw new Error("twitpic search module requires searchString to be specified as an option");

    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += refreshURL != ""?refreshURL:'?q='+escape(searchString)+"+twitpic";
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var i;
	var rematch;
	var twitpic_id;
	refreshURL = rawData.refresh_url || "";
	processedData.update = (rawData.results.length>0)?true:false;

	//process rawData and put it in processedData
	processedData.data = [];
	for(i in rawData.results)  {
	    //put the processed version of the raw data in the 
	    //processed data array
	    rematch = /http\:\/\/twitpic.com\/(\w+)/.exec(rawData.results[i].text);
	    if(rematch!== null && !rawData.results[i].text.match(new RegExp("^RT")))  {  //ignore retweets
		twitpic_id = rematch[1];
		rawData.results[i].twitpic_url = "http://twitpic.com/"+twitpic_id;
		rawData.results[i].twitpic_full_url = "http://twitpic.com/show/full/"+twitpic_id;
		rawData.results[i].twitpic_thumb_url = "http://twitpic.com/show/thumb/"+twitpic_id;
		rawData.results[i].twitpic_mini_url = "http://twitpic.com/show/mini/"+twitpic_id;
		processedData.data.push(rawData.results[i]);
	    }
	}
	return processedData;
    }
};