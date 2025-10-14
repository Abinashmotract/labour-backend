const mongoose = require('mongoose');
const Skill = require('../models/skillModel');
require('dotenv').config();

const skillsData = [
  { name: 'electrician', nameHindi: 'बिजली मिस्त्री', category: 'Electrical' },
  { name: 'plumber', nameHindi: 'प्लंबर', category: 'Plumbing' },
  { name: 'carpenter', nameHindi: 'बढ़ई', category: 'Woodwork' },
  { name: 'mason', nameHindi: 'राज मिस्त्री', category: 'Construction' },
  { name: 'painter', nameHindi: 'पेंटर', category: 'Painting' },
  { name: 'welder', nameHindi: 'वेल्डर', category: 'Metalwork' },
  { name: 'ac-mechanic', nameHindi: 'एसी मैकेनिक', category: 'Appliance Repair' },
  { name: 'refrigerator-mechanic', nameHindi: 'फ्रिज मैकेनिक', category: 'Appliance Repair' },
  { name: 'washing-machine-repair', nameHindi: 'वाशिंग मशीन रिपेयर', category: 'Appliance Repair' },
  { name: 'tv-repair', nameHindi: 'टीवी रिपेयर', category: 'Electronics' },
  { name: 'mobile-repair', nameHindi: 'मोबाइल रिपेयर', category: 'Electronics' },
  { name: 'computer-repair', nameHindi: 'कंप्यूटर रिपेयर', category: 'Electronics' },
  { name: 'house-cleaning', nameHindi: 'घर की सफाई', category: 'Cleaning' },
  { name: 'bathroom-cleaning', nameHindi: 'बाथरूम सफाई', category: 'Cleaning' },
  { name: 'kitchen-cleaning', nameHindi: 'रसोई सफाई', category: 'Cleaning' },
  { name: 'sofa-cleaning', nameHindi: 'सोफा सफाई', category: 'Cleaning' },
  { name: 'water-tank-cleaning', nameHindi: 'पानी टैंक सफाई', category: 'Cleaning' },
  { name: 'pest-control', nameHindi: 'कीट नियंत्रण', category: 'Pest Control' },
  { name: 'gardener', nameHindi: 'माली', category: 'Gardening' },
  { name: 'cook', nameHindi: 'रसोइया', category: 'Cooking' },
  { name: 'driver', nameHindi: 'चालक', category: 'Transport' },
  { name: 'watchman', nameHindi: 'चौकीदार', category: 'Security' },
  { name: 'housekeeping', nameHindi: 'हाउसकीपिंग', category: 'Maintenance' },
  { name: 'construction-labour', nameHindi: 'निर्माण मजदूर', category: 'Construction' },
  { name: 'furniture-assembling', nameHindi: 'फर्नीचर असेंबलिंग', category: 'Assembly' },
  { name: 'roof-waterproofing', nameHindi: 'छत वॉटरप्रूफिंग', category: 'Construction' },
  { name: 'tile-fitting', nameHindi: 'टाइल फिटिंग', category: 'Construction' },
  { name: 'marble-polish', nameHindi: 'मार्बल पॉलिश', category: 'Construction' },
  { name: 'pop-false-ceiling', nameHindi: 'पीओपी फॉल्स सीलिंग', category: 'Construction' },
  { name: 'cctv-installation', nameHindi: 'सीसीटीवी इंस्टॉलेशन', category: 'Security' },
  { name: 'fan-installation', nameHindi: 'फैन इंस्टॉलेशन', category: 'Electrical' },
  { name: 'inverter-setup', nameHindi: 'इन्वर्टर सेटअप', category: 'Electrical' },
  { name: 'aluminium-fabrication', nameHindi: 'एल्यूमीनियम फैब्रिकेशन', category: 'Metalwork' },
  { name: 'glass-work', nameHindi: 'ग्लास वर्क', category: 'Construction' },
  { name: 'iron-grills-gates', nameHindi: 'लोहे की जाली और गेट', category: 'Metalwork' },
  { name: 'scaffolding', nameHindi: 'स्कैफोल्डिंग', category: 'Construction' },
  { name: 'elevator-maintenance', nameHindi: 'लिफ्ट मेंटेनेंस', category: 'Maintenance' },
  { name: 'landscaping', nameHindi: 'लैंडस्केपिंग', category: 'Gardening' },
  { name: 'septic-tank-cleaning', nameHindi: 'सेप्टिक टैंक सफाई', category: 'Cleaning' },
  { name: 'general-labour', nameHindi: 'सामान्य मजदूर', category: 'General' },
  { name: 'other', nameHindi: 'अन्य', category: 'Other' }
];

async function populateSkills() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    let createdCount = 0;
    let updatedCount = 0;

    for (const skillData of skillsData) {
      const existingSkill = await Skill.findOne({ name: skillData.name });
      
      if (existingSkill) {
        // Update existing skill with Hindi name and category
        existingSkill.nameHindi = skillData.nameHindi;
        existingSkill.category = skillData.category;
        await existingSkill.save();
        updatedCount++;
        console.log(`Updated skill: ${skillData.name} - ${skillData.nameHindi}`);
      } else {
        // Create new skill
        const skill = new Skill(skillData);
        await skill.save();
        createdCount++;
        console.log(`Created skill: ${skillData.name} - ${skillData.nameHindi}`);
      }
    }

    console.log(`\n✅ Skills population completed:`);
    console.log(`- Created: ${createdCount} skills`);
    console.log(`- Updated: ${updatedCount} skills`);
    console.log(`- Total processed: ${skillsData.length} skills`);

  } catch (error) {
    console.error('Error populating skills:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

populateSkills();
