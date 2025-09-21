const fs = require('fs');
const serviceAccount = require('./labour-1ae3e-firebase-adminsdk-fbsvc-6e8c9ece64.json');
serviceAccount.private_key = serviceAccount.private_key.replace(/\n/g, '\\n');
console.log(JSON.stringify(serviceAccount));
