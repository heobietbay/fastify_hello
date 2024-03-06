const admin = require("firebase-admin");
const serviceAccount = require('../config/other/servicepwa-dac50-firebase-adminsdk-zzzdn-a0366bd8a9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
module.exports.verifyIdToken = (idToken) => {
  // idToken comes from the client app
  return admin.auth().verifyIdToken(idToken);
};
