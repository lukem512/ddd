// "Find me a good domain, please"
// Luke Mitchell, 2016
// github.com/lukem512

var fs = require('fs');
var request = require('request');
var async = require('async');

// Store results in memory for speed!
var __lock = false;
var results = module.exports.data = [];
var refreshed = module.exports.refreshed = {};

var ONE_HOUR = 60 * 60 * 1000;

// TODO:
// 1. Check for non-overlapping words
// 2. Check for common word pairs
// 4. Produce a score for each domains

// What makes a good domain?
function classify(domains, callback) {
	domains.forEach(function (domain) {
		// Remove numbers
    	if (/^www\.[a-zA-Z]+\.com$/.test(domain)) {

    		// Results object
    		var obj = {
    			name: domain,
    			pronouncable: false,
    			matches: {
    				words: [],
    				desirables: [],
    				highest: 0,
    				total: false
    			}
    		}

    		// Contains English words?
    		obj.matches.words = word(domain);

    		// Check for desirable words
			deswords.forEach(function (w) {
				if (domain.toUpperCase().contains(w)) {
					obj.matches.desirables.push(w);
				}
			});

			// Remove any duplicates
			// This prioritises desirables.
			obj.matches.desirables.forEach(function(w) {
				var index = obj.matches.words.indexOf(w);
				if (index > -1) {
					obj.matches.words.splice(index, 1);
				}
			});

			// Retrieve highest match length
			obj.matches.words.forEach(function (w) {
				if (w.length > obj.matches.highest) {
					obj.matches.highest = w.length;
				}
			});

			obj.matches.desirables.forEach(function (w) {
				if (w.length > obj.matches.highest) {
					obj.matches.highest = w.length;
				}
			});

			// Check for 100% length match
			if (domain.length == obj.matches.highest) {
				obj.total = true;
			}

			// Easy to pronounce?
			// TODO:
			// 1. Look for s' at the end, if not prefixed by an s
			// 2. Look for ys at the end
			// 3. Look for oos and ies
			// 4. Look for gh at the beginning and end
	   		if (/^www\.[bcdfghjklmnpqrstvwxyz(st)(th)(ph)(ch)(ck)]?([aeiou][bcdfghjklmnpqrstvwxyz(st)(th)(ph)(ch)(ck)])+[aeiou]?\.com$/.test(domain)) {
	    		obj.pronouncable = true;
	    	}

	    	// Add to array
	    	module.exports.data.push(obj);
    	}
    });

	// Callback!
	callback();
};

// Extracts domains using specified container pattern (cp).
function extract(html, cp, dp) {
	var dp = dp || /.*(www\..+\.com).*/;
	var domains = [];
	var matches = html.match(cp);
	matches.forEach(function(entry) {
		domains.push(entry.match(dp)[1]);
	});
	return domains
};

// Is the search term (needle) a word?
function word(needle) {
	var found = [];
	for (var i = needle.length; i > 0; i--) {
		if (words[i]) {
			words[i].forEach(function (w){
				if (w == '') return;
				if (needle.toUpperCase().contains(w)) {
					found.push(w);
				}
			});
		}
	}
	return found;
};
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

// Function to read and format a list of words
function readwords(filename, callback) {
	fs.readFile(filename, function read(err, data) {
	    if (err) {
	        throw err;
	    }
	    var words = data.toString().split(/[ \n]/)
	    	.map(function (o) { return o.toUpperCase() });
	    callback(words);
	});
}

// Read wordlists
// Again, store in memory.
var words = [[], [], [], [], [], []];
readwords('3-letters.txt', function(words3) { words[3] = words3; });
readwords('4-letters.txt', function(words4) { words[4] = words4; });
readwords('5-letters.txt', function(words5) { words[5] = words5; });

// Desirable words
var deswords = [];
readwords('desirable-words.txt', function(words) { deswords = words; });

// Refresh all data
var refresh = module.exports.refresh = function () {
	// Limit number of refreshes
	var now = new Date();
	if (module.exports.refreshed && (now - refreshed < ONE_HOUR)) {
		console.log('Refreshed too recently.');
		return;
	}

	// Acquire lock
	if (__lock) {
		return;
	}
	__lock = true;

	// Clear results
	module.exports.data = [];

	// Set refresh time
	module.exports.refreshed = now;
	console.log('Refreshing data...');

	var funcs = [function(callback) {
		// Pull data for 3-character domains
		request('http://www.char3.com', function (err, res, body) {
			if (err) {
				throw err;
			}
			var cp = /.*(value=\"www\..+\.com\".*)+.*/gi;
			var domains = extract(body, cp);
			classify(domains, callback);
		});
	},
	function(callback) {
		// Pull data for 4-character domains
		request('http://www.char4.com', function (err, res, body) {
			if (err) {
				throw err;
			}
			var cp = /.*(class=\"linkout\">www\..+\.com<.*)+.*/gi;
			var dp = /.*>(www\..+\.com)<.*/;
			var domains = extract(body, cp, dp);
			classify(domains, callback);
		});
	},
	function(callback) {
		// Pull data for 5-character domains
		request('http://www.char5.com', function (err, res, body) {
			if (err) {
				throw err;
			}
			var cp = /.*(value=\"www\..+\.com\".*)+.*/gi;
			var domains = extract(body, cp);
			classify(domains, callback);
		});
	}];

	// Call the request functions
	async.each(funcs,
	function(func, callback) {
		func(callback);
	},
	function(err) {
		if (err) {
			console.error(err.nessage);
		}
		__lock = false;
	});
};
refresh();
