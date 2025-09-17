// utils/firebase.js (backend)
const admin = require("firebase-admin");
const serviceAccount = require("../config/labourfirebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
