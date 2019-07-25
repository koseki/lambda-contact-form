const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const _self = module.exports;

exports.validateLength = (result, name, min, max) => {
  let value = result.params[name];

  if (min >= 0 && value.length == 0) {
    result.errors.push({field: name, type: 'required'});
    return false;
  } else if (min >= 0 && value.length < min) {
    result.errors.push({field: name, type: 'too_short'});
    return false;
  } else if (value.length > max) {
    result.errors.push({field: name, type: 'too_long'});
    return false;
  }

  return true;
}

exports.validateEmail = (result, name, required, max) => {
  let email = result.params[name];
  if (! required && email.length <= 0) {
    return true;
  }

  if (! _self.validateLength(result, name, 6, max)) { // 6 characters: a@b.cd
    return false;
  }

  // Using type=email regexp and changed the last '*' to '+'. Domain must include '.'.
  // https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
  const emailRex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!email.match(emailRex)) {
    result.errors.push({field: name, type: 'email'});
    return false;
  }

  return true;
}

exports.stringValue = (params, name, oneLine = false) => {
  if (typeof params[name] !== 'string') {
    return '';
  }
  let result = params[name]

  if (oneLine) {
    result = _self.toOneLine(result);
  }

  return result.trim();
}

exports.toOneLine = (str) => {
  str = `${str}`;
  str = str.replace(/\s+/g, ' ');
  return str.trim();
}

exports.renderMailTemplate = async (template, params) => {
  const templateFile = path.join(__dirname, template);
  const out = await promisify(fs.readFile)(templateFile, 'utf-8');
  const text = out.replace(/\{\{([-a-zA-Z0-9_]+)\}\}/g, (match, p1) => {
    return params[p1];
  });

  let m = text.match(/^([^\r\n]+)(?:\r?\n)+(.+)/s);
  return { subject: m[1].trim(), body: m[2].trim() };
}
