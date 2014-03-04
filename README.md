node-marketo-soap
=================

SOAP Module for Marketo's API

This is a simple wrapper around [node-soap](http://github.com/vpulim/soap) that is compatible with Marketo's SOAP API.

## Usage

Instead of using soap.createClient() we need to use soap.createMarketoClient():

  ```javascript
  var soap = require('node-marketo-soap');
  soap.createMarketoClient(url, function(err, client) {
      client.addSoapHeader(auth, 'AuthenticationHeader', 'tns', namespace);
      //Do something with the client...
      //Eg., create a lead:
      client.syncLead(leads, function(err, res) {
        console.log('Result: ', res.result);
      })
  });
```

