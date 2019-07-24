const AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});

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

let response;

const jsonCorsResponseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

exports.lambdaHandler = async (event, context) => {
  try {
    let email = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO.split(/\s*,\s*/),
      subject: 'SES Trial',
      body: 'test'
    };
    await sesSendEmail(email);
    response = {
      'statusCode': 200,
      'headers': jsonCorsResponseHeaders,
      'body': JSON.stringify({ message: 'OK' })
    };
  } catch (err) {
    console.log(err);
    response = {
      'statusCode': 500,
      'headers': jsonCorsResponseHeaders,
      'body': JSON.stringify({ message: 'ERROR' })
    };
  }

  return response
};
