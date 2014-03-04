'use strict';

var soap = require('soap');
var marketoClient = require('./marketoClient').createMarketoClient;
var WSDL = require('./node_modules/soap/lib/wsdl').WSDL;
var open_wsdl = require('./node_modules/soap/lib/wsdl').open_wsdl;
var _wsdlCache = {};

function _requestWSDL(url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var wsdl = _wsdlCache[url];
  if (wsdl) {
    callback(null, wsdl);
  }
  else {
    open_wsdl(url, options, function(err, wsdl) {
      if (err)
        return callback(err);
      else
        _wsdlCache[url] = wsdl;
      callback(null, wsdl);
    });
  }
}

function createMarketoClient(url, options, callback, endpoint) {
  if (typeof options === 'function') {
    endpoint = callback;
    callback = options;
    options = {};
  }
  endpoint = options.endpoint || endpoint;
  _requestWSDL(url, options, function(err, wsdl) {
    callback(err, wsdl && marketoClient(wsdl, endpoint));
  });
}

exports.BasicAuthSecurity = soap.BasicAuthSecurity;
exports.WSSecurity = soap.WSSecurity;
exports.ClientSSLSecurity = soap.ClientSSLSecurity;
exports.createClient = soap.createClient;
exports.createMarketoClient = createMarketoClient;
exports.passwordDigest = soap.passwordDigest;
exports.listen = soap.listen;
exports.WSDL = soap.WSDL;

