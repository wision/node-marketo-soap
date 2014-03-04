"use strict";

var Client = require('./node_modules/soap/lib/client').Client,
  http = require('./node_modules/soap/lib/http'),
  assert = require('assert'),
  url = require('url');

var _invoke = function(method, args, location, callback, options) {
  var self = this,
    name = method.$name,
    input = method.input,
    output = method.output,
    style = method.style,
    defs = this.wsdl.definitions,
    ns = defs.$targetNamespace,
    encoding = '',
    message = '',
    xml = null,
    soapAction = this.SOAPAction ? this.SOAPAction(ns, name) : (method.soapAction || (((ns.lastIndexOf("/") !== ns.length - 1) ? ns + "/" : ns) + name)),
    headers = {
      SOAPAction: '"' + soapAction + '"',
      'Content-Type': "text/xml; charset=utf-8"
    },
    alias = findKey(defs.xmlns, ns);

  options = options || {};

  // Allow the security object to add headers
  if (self.security && self.security.addHeaders)
    self.security.addHeaders(headers);
  if (self.security && self.security.addOptions)
    self.security.addOptions(options);

  if (input.parts) {
    assert.ok(!style || style === 'rpc', 'invalid message definition for document style binding');
    message = self.wsdl.objectToRpcXML(name, args, alias, ns);
    (method.inputSoap === 'encoded') && (encoding = 'soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" ');
  } else if (typeof (args) === 'string') {
    message = args;
  } else {
    assert.ok(!style || style === 'document', 'invalid message definition for rpc style binding');
    message = self.wsdl.objectToDocumentXML(input.$name, args, input.targetNSAlias, input.targetNamespace, input.$type);
  }
  xml = self._startMarketoEnvelope() +
    self._startMarketoHeader() +
    self._startMarketoAuthHeader() +
    (self.soapHeaders ? self.soapHeaders.join("\n") : "") +
    self._endMarketoAuthHeader() +
    self._endMarketoHeader() +
    self._startMarketoBody() +
    message +
    self._endMarketoBody() +
    self._endMarketoEnvelope();

  self.lastRequest = xml;

  http.request(location, xml, function(err, response, body) {
    var result;
    var obj;
    self.lastResponse = body;
    self.lastResponseHeaders = response && response.headers;
    if (err) {
      callback(err);
    } else {
      try {
        obj = self.wsdl.xmlToObject(body);
      } catch (error) {
        error.response = response;
        error.body = body;
        return callback(error, response, body);
      }

      result = obj.Body[output.$name];
      // RPC/literal response body may contain elements with added suffixes I.E.
      // 'Response', or 'Output', or 'Out'
      // This doesn't necessarily equal the ouput message name. See WSDL 1.1 Section 2.4.5
      if(!result){
        result = obj.Body[output.$name.replace(/(?:Out(?:put)?|Response)$/, '')];
      }

      callback(null, result, body);
    }
  }, headers, options);
};

function findKey(obj, val) {
  for (var n in obj)
    if (obj[n] === val)
      return n;
}

var _startMarketoEnvelope = function() {
  return '<SOAP-ENV:Envelope ' +
    'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
  'xmlns:tns="http://www.marketo.com/mktows/" >';
};

var _startMarketoHeader = function() {
  return '<SOAP-ENV:Header>';
};

var _endMarketoHeader = function() {
  return '</SOAP-ENV:Header>';
};

var _endMarketoEnvelope = function() {
  return '</SOAP-ENV:Envelope>';
};

var _startMarketoAuthHeader = function() {
  return '<tns:AuthenticationHeader>';
};

var _endMarketoAuthHeader = function() {
  return '</tns:AuthenticationHeader>';
};

var _startMarketoBody = function() {
  return '<SOAP-ENV:Body>';
};

var _endMarketoBody = function() {
  return '</SOAP-ENV:Body>';
};

exports.createMarketoClient = function(wsdl, endpoint) {
  var MarketoClient = function(){};
  MarketoClient.prototype = new Client(wsdl, endpoint);
  MarketoClient.prototype._invoke = _invoke;
  MarketoClient.prototype._startMarketoEnvelope = _startMarketoEnvelope;
  MarketoClient.prototype._endMarketoEnvelope = _endMarketoEnvelope;
  MarketoClient.prototype._startMarketoHeader = _startMarketoHeader;
  MarketoClient.prototype._endMarketoHeader = _endMarketoHeader;
  MarketoClient.prototype._startMarketoAuthHeader = _startMarketoAuthHeader;
  MarketoClient.prototype._endMarketoAuthHeader = _endMarketoAuthHeader;
  MarketoClient.prototype._startMarketoBody = _startMarketoBody;
  MarketoClient.prototype._endMarketoBody = _endMarketoBody;
  var marketoClient = new MarketoClient();
  marketoClient.wsdl = wsdl;
  marketoClient._initializeServices(endpoint);
  return marketoClient;
};

