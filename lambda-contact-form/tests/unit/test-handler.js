'use strict'; /* global describe, it */

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
var event, context;

const defaultBody = {
  name: 'Lambda',
  title: 'This is TEST inquiry',
  'email': 'test@example.com',
  'message': 'xxx\nyyy\nzzz'
};

describe('Tests index', function () {
  it('validates successful response', async () => {
    let body = Object.assign({}, defaultBody);
    event = {
      pathParameters: { formName: 'sample1' },
      body: JSON.stringify(body)
    };
    const result = await app.lambdaHandler(event, context);

    expect(result).to.be.an('object');
    expect(result.statusCode).to.equal(200);
    expect(result.body).to.be.an('string');

    let response = JSON.parse(result.body);

    expect(response).to.be.an('object');

    expect(response.statusCode).to.equal(200);
    expect(response.status).to.equal('validated');
    expect(response.data.params.name).to.equal('Lambda');
    expect(response.data.params.title).to.equal('This is TEST inquiry');
    expect(response.data.params.email).to.equal('test@example.com');
    expect(response.data.params.message).to.equal('xxx\nyyy\nzzz');
    expect(response.data.errors).to.be.an('array').with.length(0);
  });

  it('send messages', async () => {
    let body = Object.assign({}, defaultBody);
    body.action = 'send';
    event = {
      pathParameters: { formName: 'sample1' },
      body: JSON.stringify(body)
    };
    const result = await app.lambdaHandler(event, context);

    expect(result).to.be.an('object');
    expect(result.statusCode).to.equal(200);
    expect(result.body).to.be.an('string');

    let response = JSON.parse(result.body);

    expect(response).to.be.an('object');

    expect(response.statusCode).to.equal(200);
    expect(response.status).to.equal('sent');
    // console.log(response);
    expect(response.data.adminMail.from).to.equal('info@example.com');
    expect(response.data.adminMail.to).to.be.eql(['admin@example.com']);
    expect(response.data.userMail.from).to.equal('info@example.com');
    expect(response.data.userMail.to).to.be.eql(['test@example.com']);
  });
});
