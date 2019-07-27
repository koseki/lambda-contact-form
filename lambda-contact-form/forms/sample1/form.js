const crypto = require('crypto');
const fu = require('./utils')

export formConfig = {
  staging: {
    MAIL_FROM: '',
    MAIL_TO: '',
  },
  production: {
    MAIL_FROM: '',
    MAIL_TO: '',
  }
};

exports.normalizeAndValidate = (params) => {
  let result = {
    errors: [],
    params: {},
    ext: {}
  }
  result.ext.recaptcha = params['g-recaptcha-response'];

  let name = fu.stringValue(params, 'name', true);
  result.params.name = name;
  fu.validateLength(result, 'name', 1, 100);

  let email = fu.stringValue(params, 'email', true);
  result.params.email = email;
  result.ext.emailHash = 'invalid';

  if (fu.validateEmail(result, 'email', true, 300)) {
    // Calc email hash for logging.
    try {
      const hash = crypto.createHash('sha1');
      hash.update(email);
      result.ext.emailHash = hash.digest('hex');
    } catch (err) {
      console.log(err);
      result.ext.emailHash = 'error';
    }
  }

  let title = fu.stringValue(params, 'title', true);
  result.params.title = title;
  fu.validateLength(result, 'title', -1, 500);

  let message = fu.stringValue(params, 'message');
  result.params.message = message;
  fu.validateLength(result, 'message', 1, 50000);

  return result;
}

/**
 * Return false if you don't need to send mail to the user.
 */
exports.buildUserMail = async (data) => {
  let mail = await fu.renderMailTemplate('mail.txt', data.params);
  let email = {
    from: process.env.EMAIL_FROM,
    to: [data.params['email']],
    subject: mail.subject,
    body: mail.body
  };
  return email;
}

exports.buildAdminMail = async (data) => {
  let mail = await fu.renderMailTemplate('mail.txt', data.params);
  let email = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO.split(/\s*,\s*/),
    subject: mail.subject,
    body: mail.body
  };
  return email;
}

exports.loggableData = (data) => {
  let result = {};

  if (data.ext && data.ext.emailHash) {
    result.emailHash = data.ext.emailHash;
  }

  return result;
}
