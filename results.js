// "Find me a good domain, please"
// Luke Mitchell, 2016
// github.com/lukem512

var fs = require('fs');
var request = require("request");

var results = module.exports.data = [];
var refreshed = module.exports.refreshed = {};

var ONE_HOUR = 60 * 60 * 1000;

// What makes a good domain?
function classify(domains) {
	domains.forEach(function (domain) {
		// Remove numbers
    	if (/^www\.[a-zA-Z]+\.com$/.test(domain)) {

    		// Results object
    		var obj = {
    			name: domain,
    			pronouncable: false,
    			matches: {
    				words: [],
    				highest: 0,
    				total: false
    			}
    		}

    		// Contains English words?
    		word(domain, function(matches) {

    			// Matches words?
    			if (matches.length) {
					// Store them
					obj.matches.words = matches;

					// Retrieve highest match length
					matches.forEach(function (w) {
						if (w.length > obj.matches.highest) {
							obj.matches.highest = w.length;
						}
					});

					// Check for 100% length match
					if (domain.length == obj.matches.highest) {
						obj.total = true;
					}

					// Check for non-overlapping words
					// TODO
				}

				// Easy to pronounce?
		   		if (/^www\.[bcdfghjklmnpqrstvwxyz(st)(th)(ph)(ch)(ck)]?([aeiou][bcdfghjklmnpqrstvwxyz(st)(th)(ph)(ch)(ck)])+[aeiou]?\.com$/.test(domain)) {
		    		obj.pronouncable = true;
		    	}

		    	// Add to array
		    	module.exports.data.push(obj);
    		});
    	}
    });
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
function word(needle, callback) {
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
	callback(found);
}
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
var words = [[], [], [], [], []];
readwords('3-letters.txt', function(words3) { words[3] = words3; });
readwords('4-letters.txt', function(words4) { words[4] = words4; });
readwords('5-letters.txt', function(words5) { words[5] = words5; });

// Refresh all data
var refresh = module.exports.refresh = function () {
	// Limit number of refreshes
	var now = new Date();
	if (module.exports.refreshed && (now - refreshed < ONE_HOUR)) {
		console.log('Refreshed too recently.');
		return;
	}

	// Clear results
	module.exports.data = [];

	// Set refresh time
	module.exports.refreshed = now;
	console.log('Refreshing data...');

	// Pull data for 3-character domains
	request("http://www.char3.com", function (err, res, body) {
		if (err) {
			throw err;
		}
		var cp = /.*(value=\"www\..+\.com\".*)+.*/gi;
		var domains = extract(body, cp);
		classify(domains);
	});

	// Pull data for 4-character domains
	request("http://www.char4.com", function (err, res, body) {
		if (err) {
			throw err;
		}
		var cp = /.*(class=\"linkout\">www\..+\.com<.*)+.*/gi;
		var dp = /.*>(www\..+\.com)<.*/;
		var domains = extract(body, cp, dp);
		classify(domains);
	});

	// Pull data for 5-character domains
	request("http://www.char5.com", function (err, res, body) {
		if (err) {
			throw err;
		}
		var cp = /.*(value=\"www\..+\.com\".*)+.*/gi;
		var domains = extract(body, cp);
		classify(domains);
	});
};
refresh();
