const axios = require('axios');
const querystring = require('querystring')
const AWS = require('aws-sdk');
AWS.config.update({region: process.env.APP_AWS_REGION});

const kms = new AWS.KMS({apiVersion: '2014-11-01'});

let decryptedEnv = {};
const decryptEnv = async (name) => {
  const encrypted = process.env[name];
  if (!encrypted) {
    return null;
  }
  if (decryptedEnv[name]) {
    return decryptedEnv[name];
  }

  const kmsParams = { CiphertextBlob: Buffer.from(encrypted, 'base64') };
  const data = await kms.decrypt(kmsParams).promise();
  const decrypted = data.Plaintext.toString('ascii');
  decryptedEnv[name] = decrypted;
  return decrypted;
};

const sesSendEmail = async (email) => {
  if (process.env.SEND_MAIL_MOCK == 1) {
    console.log(email);
    return;
  }

  let sesConfig = {
    apiVersion: '2010-12-01',
    region: process.env.SES_REGION
  };

  // Use role rather than the access key.
  if (process.env.SES_ACCESS_KEY_ID) {
    sesConfig.accessKeyId = process.env.SES_ACCESS_KEY_ID;
    sesConfig.secretAccesskey = await decryptEnv('SES_SECRET_ACCESS_KEY');
  }
  const ses = new AWS.SES(sesConfig);

  let sesMail = {
    Source: email.from,
    Destination: { ToAddresses: email.to },
    Message: {
      Subject: { Data: email.subject, Charset: 'UTF-8' },
      Body: { Text: { Data: email.body, Charset: 'UTF-8' }}
    }
  };
  let data = await ses.sendEmail(sesMail).promise();
  return data;
};

const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';
const verifyRecaptcha = async (token, ip) => {
  const verificationRequest = {
    response: token,
    remoteip: ip,
    secret: process.env.RECAPTCHA_SECRET_KEY,
  };
  const resp = await axios.post(RECAPTCHA_URL, querystring.stringify(verificationRequest));
  return resp.data;
}

const form = require('./form');

let response;
const buildResponse = (statusCode, status, data = {}) => {
  let corsOrigin = process.env.CORS_ORIGIN;
  corsOrigin = corsOrigin ? corsOrigin : '*';
  const jsonCorsResponseHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Content-Type': 'application/json'
  };

  let obj = {
    statusCode: statusCode,
    status: status,
    data: form.loggableData(data)
  }
  console.log(obj);

  let returnData = Object.assign({}, data);
  delete returnData.ext;
  obj.data = returnData;

  return {
    statusCode: statusCode,
    headers: jsonCorsResponseHeaders,
    body: JSON.stringify(obj)
  };
};

const logError = (err) => {
  if (err.stack) {
    console.log(err.stack);
  } else {
    console.log(err);
  }
}

exports.lambdaHandler = async (event, context) => {
  if (event.body && event.body.length > 1000000) {
    return buildResponse(400, 'request_too_large');
  }

  let rawParams;
  try {
    rawParams = JSON.parse(event.body);
  } catch (err) {
    logError(err);
    console.log(event.body);
    return buildResponse(400, 'request_parse_error');
  }

  let data;
  try {
    data = form.normalizeAndValidate(rawParams);
  } catch (err) {
    logError(err);
    console.log(event.body);
    return buildResponse(500, 'internal_error');
  }

  if (data.errors.length > 0) {
    return buildResponse(400, 'validation_error', data);
  }

  if (rawParams.action != 'send') {
    return buildResponse(200, 'validated', data);
  }

  if (process.env.RECAPTCHA_SECRET_KEY) {
    try {
      let sourceIp = event.requestContext.identity.sourceIp;
      let recaptcha = await verifyRecaptcha(data.ext.recaptcha, sourceIp);
      if (!recaptcha.success) {
        return buildResponse(400, 'recaptcha_verification_error', data);
      }
    } catch (err) {
      logError(err);
      return buildResponse(500, 'recaptcha_error', data);
    }
  }

  try {
    let adminMail = await form.buildAdminMail(data);
    if (process.env.DEBUG) {
      data.adminMail = adminMail;
    }
    await sesSendEmail(adminMail);
  } catch (err) {
    logError(err);
    return buildResponse(500, 'internal_error', data);
  }

  try {
    let userMail = await form.buildUserMail(data);
    if (process.env.DEBUG) {
      data.userMail = userMail;
    }
    if (userMail) {
      await sesSendEmail(userMail);
    }
  } catch (err) {
    logError(err);
    return buildResponse(500, 'internal_error', data);
  }

  return buildResponse(200, 'sent', data);
};
