const assert = require('assert');
const sinon = require('sinon');
const functionsTest = require('firebase-functions-test')();

// Mock nodemailer before requiring the function
const nodemailer = require('nodemailer');

let createTransportStub;
let sendMailStub;

describe('sendWelcomeEmail', () => {
  let myFunctions;

  beforeEach(() => {
    sendMailStub = sinon.stub().resolves();
    createTransportStub = sinon.stub(nodemailer, 'createTransport').returns({
      sendMail: sendMailStub,
    });
    // Re-require after stubbing
    delete require.cache[require.resolve('../index')];
    myFunctions = require('../index');
  });

  afterEach(() => {
    functionsTest.cleanup();
    sinon.restore();
  });

  it('sends a welcome email with display name', async () => {
    const wrapped = functionsTest.wrap(myFunctions.sendWelcomeEmail);
    await wrapped({ email: 'test@example.com', displayName: 'Tester' });
    assert.strictEqual(sendMailStub.calledOnce, true);
    const options = sendMailStub.firstCall.args[0];
    assert.strictEqual(options.to, 'test@example.com');
    assert.ok(options.html.includes('Tester'));
  });
});
