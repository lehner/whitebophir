/*
  Author: Christoph Lehner
  Minimal session handling
*/
var fs = require("fs")
, cookie = require("cookie");

const max_session_lifetime_days = 1.0;

class Session {
    constructor() {
	this.sessions = {};
    }
    
    authenticate(key, request) {
	var keyRef = fs.readFileSync('/opt/app/root-wbo/pwd', 'utf8');
	if (keyRef == key) {
	    var rawSID = (Date.now().toString(36) + Math.random().toString(36).substr(2)).toUpperCase();

	    this.sessions[rawSID] = {
		"timestamp" : new Date(),
		"IP" : request.connection.remoteAddress
	    };

	    console.log("New session:", this.sessions[rawSID]);
	    return rawSID;
	}
	
	return "invalid";
    }

    purge() {
	var now_ms = (new Date()).getTime();
	for (var sid in this.sessions) {
	    var millisec_diff = now_ms - this.sessions[sid].timestamp.getTime();
	    var sec_diff = millisec_diff / 1000.0;
	    var day_diff = sec_diff / 3600.0 / 24.;
	    if (day_diff < 0 || day_diff > max_session_lifetime_days) {
		delete this.sessions[sid];
	    }
	}
    }
    
    isAuthRequest(request) {

	this.purge();
	
	var cook = cookie.parse(request.headers.cookie || '');
	if ("sessionId" in cook) {
	    var sid = cook["sessionId"];
	    if (sid in this.sessions) {
		var session = this.sessions[sid];
		if (session.IP == request.connection.remoteAddress) {
		    session.timestamp = new Date();
		    return true;
		}
	    }
	}

	return false;
    }

};

var session = new Session();

if (exports) {
    exports.session = session;
}
