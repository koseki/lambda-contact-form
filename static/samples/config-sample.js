// Edit and rename to config.js

var recaptchaSiteKey = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
var apiURLs;

apiURLs = {
  validate: ['POST', '/post'],
  send:     ['POST', '/post'],
};

apiURLs = {
  validate: ['GET', '/samples/validated.json'],
  // validate: ['GET', '/samples/validation_error.json'],
  send:     ['GET', '/samples/sent.json'],
};

/*
var apiurl = 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod/post';
apiURLs = {
  validate: ['POST', apiURL],
  send:     ['POST', apiURL],
};
*/
