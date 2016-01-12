var results = require('./results');

var all = module.exports.all = function (req, res) {
	res.send(results);
}

var words = module.exports.words = function (req, res) {
	req.params.length = req.params.length || 3
	var send = [];
	results.forEach(function (domain) {
		if (domain.matches.highest >= req.params.length) {
			send.push(domain);
		}
	});
	res.send(send);
};

var pronouncable = module.exports.pronouncable = function (req, res) {
	var send = [];
	results.forEach(function (domain) {
		if (domain.pronouncable) {
			send.push(domain);
		}
	});
	res.send(send);
};
