/**
 * spotter.delicious.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: implement hotlist feed, should be very easy
 *
 */

(function(window, name)  {
    var spotterjs = window.spotterjs;

    if(!spotterjs || !spotterjs.verify)  {
	throw new Error("problem with spotter.js file!");
    }
    spotterjs.verify(['util','modules']);
    var ns = spotterjs.namespace(name);

    ns.recent = function(options)  {
	spotterjs.modules.Module.call(this,options);

	var find = function (item, array)  {
	    for(var i = 0; i < array.length; ++i)  {
		if(array[i].u === item.u) {
		    return i;
		}
	    }
	    return array.length;
	};

	var lastTop;
	this.url = function()  {
	    var url = 'http://feeds.delicious.com/v2/json/recent?count=100';
	    return url;
	};

	this.process = function(data)  {
	    var processedData = {};
	    var pops;
	    if(lastTop === undefined)  {
		lastTop = data[0];
		processedData = {data:data, update:true};
	    }
	    else if(lastTop.u === data[0].u)  {
		processedData = {data:data, update:false};
	    }
	    else  {
		pops = data.length - find(lastTop, data);
		for(var i = 0; i < pops; i++) {
		    data.pop();
		}
		processedData = {data:data, update:true};
		lastTop = data[0];
	    }
	    return processedData;
	};
	

    }; //end recent module

    /**
     * Required options: tags
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new bookmarks
     * data: the bookmark objects themselves
     *
     * @constructor
     */
    ns.tags = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
	var tags = options.tags;
	
	if(tags === undefined || tags === "")  {
	    throw new Error("delicious tags module requires tags to be specified as an option");	
	}
	
	var lastTop;

	var find = function (item, array)  {
	    for(var i = 0; i < array.length; ++i)  {
		if(array[i].u === item.u) { 
		    return i;
		}
	    }
	    return array.length;
	};

	this.url = function()  {
	    var url = 'http://feeds.delicious.com/v2/json/tag/'+tags+'?count=100';
	    return url;
	};
	
	/**
         * process delicious data
         *
         * @param data This is the raw data from Spotter
         */
	this.process = function(data)  {
	    var processedData = {};
	    var pops;
	    if(lastTop === undefined)  {
		lastTop = data[0];
		processedData = {data:data, update:true};
	    }
	    else if(lastTop.u === data[0].u)  {
		processedData = {data:data, update:false};
	    }
	    else  {
		pops = data.length - find(lastTop, data);
		for(var i = 0; i < pops; i++) {
		    data.pop();
		}
		processedData = {data:data, update:true};
		lastTop = data[0];
	    }
	    return processedData;
	};
	

    };
})(window, "delicious");
