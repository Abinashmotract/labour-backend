const fs = require('fs');
const path = require('path');

function fixFirebasePrivateKey() {
  console.log('🔧 Fixing Firebase private key formatting...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Read the .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if FIREBASE_CONFIG exists
    if (!envContent.includes('FIREBASE_CONFIG=')) {
      console.log('❌ FIREBASE_CONFIG not found in .env file');
      return;
    }
    
    // Extract the JSON part
    const match = envContent.match(/FIREBASE_CONFIG=(.+)/);
    if (!match) {
      console.log('❌ Could not extract FIREBASE_CONFIG');
      return;
    }
    
    let firebaseConfig;
    try {
      firebaseConfig = JSON.parse(match[1]);
    } catch (error) {
      console.log('❌ Invalid JSON in FIREBASE_CONFIG:', error.message);
      return;
    }
    
    // Fix the private key formatting
    if (firebaseConfig.private_key) {
      console.log('🔍 Original private key length:', firebaseConfig.private_key.length);
      
      // Fix escaped newlines
      firebaseConfig.private_key = firebaseConfig.private_key.replace(/\\n/g, '\n');
      
      console.log('✅ Fixed private key formatting');
      console.log('🔍 Fixed private key length:', firebaseConfig.private_key.length);
      
      // Update the .env file
      const newFirebaseConfig = JSON.stringify(firebaseConfig);
      const newEnvContent = envContent.replace(
        /FIREBASE_CONFIG=.+/,
        `FIREBASE_CONFIG=${newFirebaseConfig}`
      );
      
      fs.writeFileSync(envPath, newEnvContent);
      console.log('✅ Updated .env file with fixed private key');
    } else {
      console.log('❌ No private_key found in FIREBASE_CONFIG');
    }
    
  } catch (error) {
    console.error('❌ Error fixing Firebase key:', error.message);
  }
}

// Run the fix
fixFirebasePrivateKey();
