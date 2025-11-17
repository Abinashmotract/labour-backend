// utils/awsSNS.js
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
require('dotenv').config();

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function sendSMS(phone, message) {
  try {
    const params = {
      Message: message,
      PhoneNumber: phone, // E.164 format: +919876543210
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional" // OR 'Promotional'
        }
      }
    };

    const result = await snsClient.send(new PublishCommand(params));
    console.log("SMS Sent:", result);
    return result;
  } catch (err) {
    console.error("SMS Error:", err);
    throw err;
  }
}

module.exports = { sendSMS };