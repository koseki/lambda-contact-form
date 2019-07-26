function showValidationErrors(data) {
  var messages = {
    required: '<strong>{{Field}}</strong> is required.',
    too_long: '<strong>{{Field}}</strong> is too long.',
    too_short: '<strong>{{Field}}</strong> is too short.',
    email: 'Please enter a correct <strong>email address</strong>.',
  };
  var fieldLabels = {
    name: 'name',
    email: 'email',
    title: 'title',
    message: 'message'
  };

  var errors = data.errors;
  var html = '<ul>';
  errors.forEach(function(error, i) {
    var msg = messages[error.type];
    if (!msg) {
      msg = error.type;
    }
    var label = fieldLabels[error.field];
    msg = msg.replace(/\{\{field\}\}/, label);
    msg = msg.replace(/\{\{Field\}\}/, label.charAt(0).toUpperCase() + label.slice(1));
    html += '<li>' + msg + '</li>';
  });
  html += '</ul>';

  updateErrorHTML(html);
  switchView('fields');
}
function showSystemError() {
  updateErrorHTML('<ul><li>System error</li></ul>');
  switchView('fields');
}
function showNetworkError() {
  updateErrorHTML('<ul><li>Network error</li></ul>');
  switchView('fields');
}

function switchView(name) {
  var names = ['loading', 'fields', 'confirm', 'complete'];
  names.forEach(function(n, i) {
    if (n == name) {
      document.getElementById(n).style.display = '';
    } else {
      document.getElementById(n).style.display = 'none';
    }
  });
}

function updateFieldValues(params) {
  var fields = document.querySelectorAll('.field');
  Array.prototype.forEach.call(fields, function(f, i) {
    f.value = params[f.name];
    var cf = document.getElementById('confirm-' + f.name);
    if (cf) {
      cf.textContent = params[f.name];
    }
  });
}

function fieldValues() {
  var fields = document.querySelectorAll('.field');
  var values = {};
  Array.prototype.forEach.call(fields, function(f, i) {
    values[f.name] = f.value;
  });
  return values;
}

function parseJSON(json) {
  try {
    return JSON.parse(json);
  } catch(e) {
    console.log(e);
    return null;
  }
}

function updateErrorHTML(html) {
  var e = document.getElementById('errors');
  e.innerHTML = html;
}

function apiRequest(action) {
  var data = fieldValues();
  data.action = action;

  var request = new XMLHttpRequest();
  request.open(apiURLs[action][0], apiURLs[action][1], true);

  // Content-Type requires CORS.
  // request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    var result = parseJSON(this.response);
    console.log(result);
    if (!result.data) {
      showSystemError();
      return;
    }
    if (result.statusCode == 200) {
      updateErrorHTML('');
      if (action == 'validate') {
        updateFieldValues(result.data.params);
        switchView('confirm');
      } else {
        switchView('complete');
      }
      return;
    }
    if (result.status == 'validation_error') {
      updateFieldValues(result.data.params);
      showValidationErrors(result.data);
      return;
    }
    showSystemError();
  };
  request.onerror = function() {
    showNetworkError();
  };

  request.send(JSON.stringify(data));
}

function init() {
  var confirmButton = document.getElementById('fields-confirm');
  confirmButton.addEventListener('click', function(event) {
    event.preventDefault();
    switchView('loading');
    apiRequest('validate');
  });

  var editButton = document.getElementById('confirm-edit');
  editButton.addEventListener('click', function(event) {
    event.preventDefault();
    switchView('fields');
  });

  /*
  var sendButton = document.getElementById('confirm-send');
  sendButton.addEventListener('click', function(event) {
  });
  */
}

function reCaptchaTokenGenerated(token) {
  var e = document.getElementById('field-recaptcha');
  e.value = token;

  switchView('loading');
  apiRequest('send');
}

document.addEventListener('DOMContentLoaded', init);
