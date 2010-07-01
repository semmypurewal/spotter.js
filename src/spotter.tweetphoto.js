/**
 * spotter.tweetphoto.js
 * Copyright (C) 2010 Semmy Purewal
 */

if(!com.yellowsocket.spotter)
    throw new Error("com.yellowsocket.spotter not yet loaded!");

if(!com.yellowsocket.spotter.util)
    throw new Error("com.yellowsocket.spotter.util not yet loaded!");

if(!com.yellowsocket.spotter.modules) com.yellowsocket.spotter.modules = {};
else if(typeof com.yellowsocket.spotter.modules != "object")
    throw new Error("com.yellowsocket.spotter.modules is not an object!");

if(!com.yellowsocket.spotter.modules.tweetphoto) com.yellowsocket.spotter.modules.tweetphoto = {};
else if(typeof com.yellowsocket.spotter.modules.tweetphoto != "object")
    throw new Error("com.yellowsocket.spotter.modules.tweetphoto is not an object!");

/**
 * Required options: searchString
 * Other available options: ?
 * callback return format: {update, data}
 *
 * In addition to the normal tweetphoto API response each object
 * includes the following:
 *
 * tweetphoto_url
 * tweetphoto_thumbnail_url
 * tweetphoto_mini_url
 *
 * update: true/false depending on whether there are new tweets
 * data: the tweet objects themselves
 */
com.yellowsocket.spotter.modules.tweetphoto.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.searchString;

    if(searchString === undefined || searchString === "")
	throw new Error("tweetphoto search module requires searchString to be specified as an option");

    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += refreshURL != ""?refreshURL:'?q='+escape(searchString)+"+tweetphoto";
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var i;
	var rematch;
	var tweetphoto_id;
	refreshURL = rawData.refresh_url || "";
	processedData.update = (rawData.results.length>0)?true:false;

	//process rawData and put it in processedData
	processedData.data = [];
	for(i in rawData.results)  {
	    //put the processed version of the raw data in the 
	    //processed data array
	    rematch = /http\:\/\/tweetphoto.com\/(\w+)/.exec(rawData.results[i].text);
	    if(rematch!== null && !rawData.results[i].text.match(new RegExp("^RT")))  {  //ignore retweets
		tweetphoto_id = rematch[1];
		rawData.results[i].tweetphoto_url = rematch[0];
		rawData.results[i].tweetphoto_full_url = "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=big&url="+rematch[0];
		rawData.results[i].tweetphoto_thumb_url = "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=thumbnail&url="+rematch[0];
		rawData.results[i].tweetphoto_mini_url =  "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=medium&url="+rematch[0];
		processedData.data.push(rawData.results[i]);
	    }
	}
	return processedData;
    }
};