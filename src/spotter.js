/**
 * spotter.js
 * Copyright (C) 2010-2011 Semmy Purewal
 *
 * @version .2
 */

(function(window)  {
    var spotterjs = {};

    /**
     * Construct a Spotter object of the specified type with the specified
     * options.  See the specific module documentation for available
     * options.
     *
     * @constructor
     * @param {String} type the type the module type associated witht this spotter, e.g. "twitter.search"
     * @param {Object} options a hash of options for the appropriate module, e.g. {searchString: "Justin Beiber"}
     * @param {Object} optional list of options to spotter
     * @throws {Error} An error is thrown if there is a problem loading the module
     */
    spotterjs.Spotter = function(type, options, spotter_options)  {
	spotterjs.Spotter.instanceCount = (spotterjs.Spotter.instanceCount === undefined)?
	    1:
	    spotterjs.Spotter.instanceCount+1;
	var varName =  "_so"+spotterjs.Spotter.instanceCount;
	var spotting = false;
	var lastCallReturned = true;
	var lastScriptTag = null;
	var observers = [];
	var timer = null;
	var module;
	var buffer = [];
	var isBuffered;
	var bufferTimer;
	var bufferTimeout;

	if(spotter_options && spotter_options.buffer === true)  {
	    isBuffered = true;
	    bufferTimeout = (spotter_options.bufferTimeout && spotter_options.bufferTimeout > 0)?
		spotter_options.bufferTimeout:
		1000;
	}
	
	window.spotterjs[varName] = this;
	
	if(!spotterjs.modules[type.split(".")[0]] || !spotterjs.modules[type.split(".")[0]][type.split(".")[1]])  {
	    throw new Error("Spotter: Module " + type + " not found! (Did you remember to include it via a script tag?)");
	}

	try  {
	    module = new (window.spotterjs.modules[type.split(".")[0]][type.split(".")[1]])(options);
	} catch(e)  {
	    throw new Error("problem creating "+type+" module -- "+e);
	}
	
	if(!module.url || !module.process)  {
	    throw new Error("Spotter: spotterjs.modules."+type+" is invalid.  (Does it return an object with url and process methods?)");
	}


	/**
         * Function that actually makes the request.
         *
         * @private
         * @param {String} url the json request URL
         */
	var request = function(url)  {
	    var head = document.getElementsByTagName("head");
	    var script = document.createElement('script');
	    script.id = varName+'_'+'request';
	    script.type = 'text/javascript';
	    script.src = url;
	    if(lastScriptTag) {
		head[0].removeChild(lastScriptTag);
	    }
	    head[0].appendChild(script);
	    lastScriptTag = script;
	};

	/**
         * Notify this Observable's observers
         *
         * @private
         * @param {Object} data that will be sent to the observers
         */
	var notifyObservers = function(data)  {
	    for(var i in observers)  {
		if(typeof observers[i] === 'object')  {
		    observers[i].notify(data);
		}  else if(typeof observers[i] === 'function')  {
		    observers[i](data);
		}  else  {
		    throw new Error("observer list contains an invalid object");
		}
	    }
	};

	/**
         * Notify this Observable's observers in a buffered manner
         *
         * @private
         */
	var bufferedNotifyObservers = function()  {
	    if(spotting) {
		if(buffer.length > 0)  {
		    bufferTimer = setTimeout(function()  {
			notifyObservers(buffer.pop());
			bufferedNotifyObservers();
		    }, bufferTimeout);
		} else  {
		    clearTimeout(bufferTimer);
		    bufferTimer = false;
		}
	    }
	};

	/**
         * A single spot request
         *
         * @private
         */
	var spot = function()  {
	    var url;
	    var obj = this;
	    
	    if(lastCallReturned)  {
		url = module.url();
		if(url instanceof Object && url.callbackParam !== undefined)  {
		    url = url.url+'&'+url.callbackParam+'=spotterjs.'+varName+'.callback';
		}
		else  {
		    url += '&callback=spotterjs.'+varName+'.callback';
		}
		url += '&random='+Math.floor(Math.random()*10000);  //add random number to help avoid caching in safari and chrome
		request(url);
	    }
	};

	/**
         * Start spotting.
         *
         * TODO: set up a time out so that if the last request doesn't return 
         *       the remaining requests are not blocked
         */
	this.start = function()  {
	    if(!spotting) { 
		spotting = true;
		spot();
	    }  else  {
		throw new Error("Spotter: You can't start a spotter that is already running!");
	    }
	};

	/**
         * Receives the response from the ajax request and send it
         * to the appropriate module for processing.  Notifies
         * observers if the module determines there is new data.
         *
         * @param {Object} rawData Unprocessed data direct from the API
         */
	this.callback = function(rawData)  {
	    var processedData = module.process(rawData); //send the raw data to the module for processing
	    var i;
	    //now the processedData has an 'update' attribute and a 'data' attribute
	    if(processedData.update) {
		if(!isBuffered)  {
		    notifyObservers(processedData.data);
		} else  {
		    for(i=0; i < processedData.data.length; i++)  {
			buffer.push(processedData.data[i]);
		    }
		    if(!bufferTimer)  {
			bufferedNotifyObservers();
		    }
		}
	    }
	    lastCallReturned = true;
	    if(module.nextTimeout() > 0)  {
		timer = setTimeout(spot, module.nextTimeout()*1000);
	    }
	    else  {
		this.stop();
	    }
	};

	/**
         * Stops this spotter if it is currently spotting.
         *
         * @throws Error An error is thrown if you try to stop a stopped spotter
         */
	this.stop = function()  {
	    if(!spotting)  {
		throw new Error("Spotter: You can't stop a stopped spotter!");
	    }
	    else  {
		spotting = false;
		var head = document.getElementsByTagName("head");
		if(lastScriptTag) {
		    head[0].removeChild(lastScriptTag);
		}
		clearTimeout(timer);
		if(bufferTimer) {
		    clearTimeout(bufferTimer);
		}
	    }
	};
    
	/**
         * Register an observer with this object
         *
         * @param {Object} observer this object will be notified when new data is available
         * @throws TypeError a TypeError is thrown if the parameter does not implement notify
         */
	this.register = function(observer) {
	    if(observer !== undefined && observer.notify !== undefined && typeof observer.notify === 'function')  {
		observers.push(observer);
	    } else if(observer !== undefined && typeof observer === 'function')  {
		observers.push(observer);
	    } else  {
		throw new TypeError('Observer must implement a notify method.');
	    }
	};
    

    }; //end spotter constructor


    /************************************ END SPOTTER ***********************************/



    /************************************ UTILS ***********************************/

    /**
     * @namespace
     * The util namespace
     */
    spotterjs.util = {};


    /**
     * Returns an array of integers that represent
     * the indices of the elements of b in the elements
     * of a.  Currently assumes these are trend objects.
     * Also assumes that all elements in a and b are uniq
     * (i.e. they are sets)
     *
     * For example
     *
     * a:      ["a","b","c","d"]
     * b:      ["c","b","d","f"]
     * result: [-1 , 1 , 0 , 2 ]  
     *
     * @param {Array} An array of length n
     * @param {Array} An array of length n
     *
     * TODO: make this more general
     * TODO: make this private
     */
    spotterjs.util.changes = function(a,b)  {
	/*a = [{'name':'a'},{'name':'b'},{'name':'c'},{'name':'d'}];
          b = [{'name':'c'},{'name':'b'},{'name':'d'},{'name':'f'}];*/
	
	var result = [];
	var indices = {};
	var i;
	for(i=0; i < b.length; i++)  {
	    //indices[b[i]]===undefined?indices[b[i].name]=parseInt(i,10):null;
	    if(!indices[b[i]])  {
		indices[b[i].name]=parseInt(i,10);
	    }
	}
	for(i=0; i < a.length; i++)  {
	    result[i] = indices[a[i].name]===undefined?-1:indices[a[i].name];
	}
	return result;
    };

    /**
     * returns an array of arrays.  the first
     * are the elements in a that are not in b
     * and the second are the elements in b that
     * are not in a.
     *
     * For now this assumes a trends object
     *
     * TODO: make more general (for arbitrary arrays)
     * TODO: use the changes algorithm as a subroutine
     */
    spotterjs.util.complements = function(a, b)  {
	var counts = {};
	var aMinusB = [];
	var bMinusA = [];
	var i, j, k;
	for(i=0; i<a.length; i++)  {
	    //counts[a[i]]===undefined?counts[a[i].name]=i:null;
	    if(counts[a[i]]===undefined)  {
		counts[a[i].name]=i;
	    }
	}
	for(j=0; j < j.length;  j++)  {
	    //counts[b[j].name]===null?bMinusA.push(b[j]):counts[b[j].name]=-1;
	    if(counts[b[j].name]===null)  {
		bMinusA.push(b[j]);
	    } else  {
		counts[b[j].name]=-1;
	    }
	}
	for(k in counts)  {
	    //counts[k] >= 0?aMinusB.push(a[counts[k]]):null;
	    if(counts[k] >= 0)  {
		aMinusB.push(a[counts[k]]);
	    }
	}
	return [aMinusB,bMinusA];
    };


    /************************************ END UTILS ***********************************/


    /************************************ MODULES ***********************************/
    /**
     * @namespace
     * The module namespace
     */
    spotterjs.modules = {};

    /**
     * @constructor
     * The general Module from which everything else inherits
     */
    spotterjs.modules.Module = function(options, opts) {
	var period;
	var generalOptions = ['period'];

	if(options.period !== undefined && typeof(options.period)==="number")  {
	    period = options.period;
	    delete options.period;
	}  else  {
	    period = 45;
	}

	this.nextTimeout = function(t)  {
	    if(t !== undefined)  {
		period = t;
	    } else  {
		return period;
	    }
	};

	var contains = function(arr, item)  {
	    var i;
	    for(i=0; i < arr.length; i++)  {
		if(arr[i]===item)  {
		    return true;
		}
	    }
	    return false;
	};

	var optionsProcess = function(opts)  {
	    var i;
	    for(i = 0; i < opts.require.length; i++)  {
		if(options[opts.require[i]] === undefined || options[opts.require[i]] === "")  {
		    throw new Error("this module requires nonempty option "+opts.require[i]);
		}
	    } 
	    for(i in options)  {
		if(!contains(opts.allow, i) && !contains(generalOptions, i) && !contains(opts.require, i))  {
		    throw new Error("option '" + i + "' not allowed");
		}
	    }
	};

	this.baseURL = function(b)  {
	    if(b && typeof b === "string")  {
		base = b;
	    }
	    else  {
		return base;
	    }
	};

	//var optionsProcess = this.options;
	if(opts)  {
	    optionsProcess(opts);
	}
    };
    /************************************ END MODULES ***********************************/


    spotterjs.verify = function(items)  {
	var i;
	for(i = 0; i < items.length; i++)  {
	    if(!spotterjs[items[i]] || (typeof spotterjs[items[i]] !== "object" && typeof spotterjs[items[i]] !== "function"))  {
		throw new Error(items[i]+" not loaded.  Make sure you load spotter.js before loading any modules.");
	    }
	}
    };
    
    spotterjs.namespace = function(name)  {
	if(!spotterjs.modules[name]) {
	    spotterjs.modules[name] = {};
	    return spotterjs.modules[name];
	} else if(typeof spotterjs.modules[name] !== "object")  {
	    throw new Error("spotterjs.modules." + name +" is not an object!");
	}
    };

    //namespace shortcuts
    window.spotterjs = spotterjs;
    window.Spotter = spotterjs.Spotter;
})(window); 