const fs = require('fs');
const path = require('path');

// Hindi translations for common messages
const hindiTranslations = {
  // Auth Controller
  "Phone number or UserId is required": "फोन नंबर या यूजर आईडी आवश्यक है",
  "User not found": "उपयोगकर्ता नहीं मिला",
  "OTP sent successfully": "OTP सफलतापूर्वक भेजा गया",
  "Internal server error": "आंतरिक सर्वर त्रुटि",
  "Invalid OTP": "अमान्य OTP",
  "OTP expired": "OTP समाप्त हो गया",
  "Phone verified successfully": "फोन सफलतापूर्वक सत्यापित हो गया",
  "Phone not verified": "फोन सत्यापित नहीं है",
  "User already registered": "उपयोगकर्ता पहले से पंजीकृत है",
  "User registered successfully": "उपयोगकर्ता सफलतापूर्वक पंजीकृत",
  "Phone number is required!": "फोन नंबर आवश्यक है!",
  "Password is required!": "पासवर्ड आवश्यक है!",
  "Invalid role specified! Must be labour or contractor": "अमान्य भूमिका निर्दिष्ट! मजदूर या ठेकेदार होना चाहिए",
  "with this phone number not found!": "इस फोन नंबर के साथ नहीं मिला!",
  "Contractor not approved!": "ठेकेदार अनुमोदित नहीं!",
  "Incorrect password!": "गलत पासवर्ड!",
  "Login successful!": "लॉगिन सफल!",
  "Invalid email format": "अमान्य ईमेल प्रारूप",
  "Invalid role specified": "अमान्य भूमिका निर्दिष्ट",
  "not found with this email": "इस ईमेल के साथ नहीं मिला",
  "Please wait": "कृपया प्रतीक्षा करें",
  "minutes before requesting a new OTP": "मिनट नया OTP अनुरोध करने से पहले",
  "OTP sent successfully!": "OTP सफलतापूर्वक भेजा गया!",
  "Missing OTP or invalid role specified": "OTP गुम है या अमान्य भूमिका निर्दिष्ट",
  "OTP verification already in progress. Please wait.": "OTP सत्यापन पहले से चल रहा है। कृपया प्रतीक्षा करें।",
  "Invalid or expired OTP": "अमान्य या समाप्त OTP",
  "OTP verified successfully!": "OTP सफलतापूर्वक सत्यापित!",
  "Invalid or expired token": "अमान्य या समाप्त टोकन",
  "Account not found": "खाता नहीं मिला",
  "Password reset successfully!": "पासवर्ड सफलतापूर्वक रीसेट!",
  "Phone number is required": "फोन नंबर आवश्यक है",
  "Invalid role specified. Must be 'labour' or 'contractor'": "अमान्य भूमिका निर्दिष्ट। 'मजदूर' या 'ठेकेदार' होना चाहिए",
  "not found with this phone number": "इस फोन नंबर के साथ नहीं मिला",
  "OTP sent successfully to your phone number": "आपके फोन नंबर पर OTP सफलतापूर्वक भेजा गया",
  "FCM token is required": "FCM टोकन आवश्यक है",
  "FCM token updated successfully": "FCM टोकन सफलतापूर्वक अपडेट",
  "Internal Server Error": "आंतरिक सर्वर त्रुटि",

  // Labour Availability Controller
  "Availability date is required": "उपलब्धता तिथि आवश्यक है",
  "Invalid date format": "अमान्य तिथि प्रारूप",
  "Cannot submit availability for past dates": "पिछली तिथियों के लिए उपलब्धता जमा नहीं कर सकते",
  "Labour not found": "मजदूर नहीं मिला",
  "No skills found. Please add skills to your profile first": "कोई कौशल नहीं मिला। कृपया पहले अपनी प्रोफ़ाइल में कौशल जोड़ें",
  "Availability request already submitted for": "उपलब्धता अनुरोध पहले से जमा किया गया",
  "Location not found in profile. Please update your location first": "प्रोफ़ाइल में स्थान नहीं मिला। कृपया पहले अपना स्थान अपडेट करें",
  "Availability request submitted successfully for": "उपलब्धता अनुरोध सफलतापूर्वक जमा किया गया",
  "Availability requests fetched successfully": "उपलब्धता अनुरोध सफलतापूर्वक प्राप्त किए गए",
  "Availability request not found or already cancelled": "उपलब्धता अनुरोध नहीं मिला या पहले से रद्द",
  "Availability request cancelled successfully": "उपलब्धता अनुरोध सफलतापूर्वक रद्द",
  "Date parameter is required (YYYY-MM-DD format)": "तिथि पैरामीटर आवश्यक है (YYYY-MM-DD प्रारूप)",
  "Invalid date format. Use YYYY-MM-DD": "अमान्य तिथि प्रारूप। YYYY-MM-DD का उपयोग करें",
  "Availability status fetched successfully": "उपलब्धता स्थिति सफलतापूर्वक प्राप्त",
  "Location coordinates are required": "स्थान निर्देशांक आवश्यक हैं",
  "Cannot toggle availability for past dates": "पिछली तिथियों के लिए उपलब्धता टॉगल नहीं कर सकते",
  "No skills found. Please add skills to your profile first": "कोई कौशल नहीं मिला। कृपया पहले अपनी प्रोफ़ाइल में कौशल जोड़ें",
  "has been turned OFF": "बंद कर दिया गया है",
  "has been turned ON": "चालू कर दिया गया है",
  "Skills parameter is required": "कौशल पैरामीटर आवश्यक है",
  "No valid skills found": "कोई वैध कौशल नहीं मिला",
  "Available labourers for": "के लिए उपलब्ध मजदूर",
  "fetched successfully": "सफलतापूर्वक प्राप्त",
  "Available labourers fetched successfully": "उपलब्ध मजदूर सफलतापूर्वक प्राप्त",
  "Labour availability requests fetched successfully": "मजदूर उपलब्धता अनुरोध सफलतापूर्वक प्राप्त",

  // Admin Skill Controller
  "Skill name, Hindi name, and category are required": "कौशल नाम, हिंदी नाम और श्रेणी आवश्यक हैं",
  "Skill with this name already exists": "इस नाम के साथ कौशल पहले से मौजूद है",
  "Skill created successfully": "कौशल सफलतापूर्वक बनाया गया",
  "Skills fetched successfully": "कौशल सफलतापूर्वक प्राप्त",
  "Skill not found": "कौशल नहीं मिला",
  "Skill fetched successfully": "कौशल सफलतापूर्वक प्राप्त",
  "Skill with this name already exists": "इस नाम के साथ कौशल पहले से मौजूद है",
  "Skill updated successfully": "कौशल सफलतापूर्वक अपडेट",
  "Skill deleted successfully": "कौशल सफलतापूर्वक हटाया गया",
  "skillIds array is required": "skillIds सरणी आवश्यक है",
  "skill(s) deleted successfully": "कौशल सफलतापूर्वक हटाए गए",
  "Skill": "कौशल",
  "successfully": "सफलतापूर्वक",

  // Job Post Controller
  "All fields (title, description, jobTiming, labourersRequired, validUntil) are required": "सभी फ़ील्ड (शीर्षक, विवरण, नौकरी समय, आवश्यक मजदूर, वैध तक) आवश्यक हैं",
  "Valid coordinates are required": "वैध निर्देशांक आवश्यक हैं",
  "Job post created successfully": "नौकरी पोस्ट सफलतापूर्वक बनाया गया",
  "Job posts fetched successfully": "नौकरी पोस्ट सफलतापूर्वक प्राप्त",
  "Contractor jobs fetched successfully": "ठेकेदार नौकरियां सफलतापूर्वक प्राप्त",
  "Job post not found": "नौकरी पोस्ट नहीं मिला",
  "Unauthorized: You can only update your own job posts": "अनधिकृत: आप केवल अपनी नौकरी पोस्ट अपडेट कर सकते हैं",
  "At least 1 labourer is required": "कम से कम 1 मजदूर आवश्यक है",
  "Valid until date must be in the future": "वैध तिथि भविष्य में होनी चाहिए",
  "Some skills are invalid": "कुछ कौशल अमान्य हैं",
  "Job post updated successfully": "नौकरी पोस्ट सफलतापूर्वक अपडेट",
  "Job post deleted successfully": "नौकरी पोस्ट सफलतापूर्वक हटाया गया",
  "Longitude and latitude are required": "देशांतर और अक्षांश आवश्यक हैं",
  "Nearby jobs fetched successfully": "पास की नौकरियां सफलतापूर्वक प्राप्त",

  // Notification Controller
  "Notification not found": "सूचना नहीं मिली",
  "Notification deleted successfully": "सूचना सफलतापूर्वक हटाई गई",
  "Notification marked as read": "सूचना पढ़ा गया के रूप में चिह्नित",
  "All notifications marked as read": "सभी सूचनाएं पढ़ा गया के रूप में चिह्नित",

  // User Controller
  "No signup users found!": "कोई साइनअप उपयोगकर्ता नहीं मिला!",
  "Signup users fetched successfully!": "साइनअप उपयोगकर्ता सफलतापूर्वक प्राप्त!",
  "Contractor not found!": "ठेकेदार नहीं मिला!",
  "Contractor agent status updated:": "ठेकेदार एजेंट स्थिति अपडेट:",
  "Agent not found": "एजेंट नहीं मिला",
  "Labours referred by agent": "एजेंट द्वारा संदर्भित मजदूर",
  "Labour not found!": "मजदूर नहीं मिला!",
  "Labour details fetched successfully!": "मजदूर विवरण सफलतापूर्वक प्राप्त!",
  "User not found!": "उपयोगकर्ता नहीं मिला!",
  "User fetched successfully!": "उपयोगकर्ता सफलतापूर्वक प्राप्त!",
  "User ID is required": "यूजर आईडी आवश्यक है",
  "Only labour/contractor users can be updated here": "यहां केवल मजदूर/ठेकेदार उपयोगकर्ता अपडेट किए जा सकते हैं",
  "User updated successfully": "उपयोगकर्ता सफलतापूर्वक अपडेट",
  "User deleted successfully!": "उपयोगकर्ता सफलतापूर्वक हटाया गया!",
  "Location Updated!": "स्थान अपडेट!",
  "Search results successful!": "खोज परिणाम सफल!",
  "Search failed": "खोज असफल",
  "User IDs array is required": "यूजर आईडी सरणी आवश्यक है",
  "Invalid user IDs": "अमान्य यूजर आईडी",
  "No users found to delete": "हटाने के लिए कोई उपयोगकर्ता नहीं मिला"
};

// Function to convert messages in a file
function convertFileMessages(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;

    // Replace each English message with Hindi (both single and double quotes)
    for (const [english, hindi] of Object.entries(hindiTranslations)) {
      const escapedEnglish = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Check for double quotes
      const doubleQuoteRegex = new RegExp(`"${escapedEnglish}"`, 'g');
      const doubleMatches = content.match(doubleQuoteRegex);
      if (doubleMatches) {
        content = content.replace(doubleQuoteRegex, `"${hindi}"`);
        changes += doubleMatches.length;
      }
      
      // Check for single quotes
      const singleQuoteRegex = new RegExp(`'${escapedEnglish}'`, 'g');
      const singleMatches = content.match(singleQuoteRegex);
      if (singleMatches) {
        content = content.replace(singleQuoteRegex, `'${hindi}'`);
        changes += singleMatches.length;
      }
    }

    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}: ${changes} messages converted to Hindi`);
    } else {
      console.log(`ℹ️  No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔄 Converting API messages to Hindi...\n');

const controllersDir = path.join(__dirname, '..', 'controllers');
const files = [
  'authController.js',
  'labourAvailabilityController.js',
  'admin/skillController.js',
  'admin/jobPostController.js',
  'notificationController.js',
  'userController.js'
];

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  if (fs.existsSync(filePath)) {
    convertFileMessages(filePath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✅ Hindi conversion completed!');
