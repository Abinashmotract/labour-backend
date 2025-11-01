const LabourAvailability = require('../models/labourAvailabilityModel');
const User = require('../models/userModel');
const JobPost = require('../models/jobPostModel');
const Skill = require('../models/skillModel');
const Contracter = require('../models/Contracter');
const { sendNotification } = require('../utils/notifications');

// Submit availability request for specific date(s)
const submitAvailabilityRequest = async (req, res) => {
  try {
    const { availabilityDate } = req.body;
    const labourId = req.user.id;

    // Validate input
    if (!availabilityDate) {
      return res.status(400).json({
        success: false,
        message: 'उपलब्धता तिथि आवश्यक है'
      });
    }

    // Ensure availabilityDate is always an array
    if (!Array.isArray(availabilityDate)) {
      return res.status(400).json({
        success: false,
        message: 'उपलब्धता तिथि हमेशा एक सरणी (array) के रूप में भेजी जानी चाहिए'
      });
    }
    
    const datesToProcess = availabilityDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate all dates and extract availability status
    const validDates = [];
    for (const dateItem of datesToProcess) {
      let dateStr, isAvailable = true;
      
      // Handle both string format and object format
      if (typeof dateItem === 'string') {
        dateStr = dateItem;
        isAvailable = true; // Default to true for backward compatibility
      } else if (typeof dateItem === 'object' && dateItem.date) {
        dateStr = dateItem.date;
        isAvailable = dateItem.isAvailable !== undefined ? dateItem.isAvailable : true;
      } else {
        return res.status(400).json({
          success: false,
          message: `अमान्य तिथि प्रारूप: ${JSON.stringify(dateItem)}`
        });
      }

      const requestedDate = new Date(dateStr);
      
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: `अमान्य तिथि प्रारूप: ${dateStr}`
        });
      }

      if (requestedDate < today) {
        return res.status(400).json({
          success: false,
          message: `पिछली तिथि के लिए उपलब्धता जमा नहीं कर सकते: ${dateStr}`
        });
      }

      // Normalize the date to start of day
      requestedDate.setHours(0, 0, 0, 0);
      validDates.push({ date: requestedDate, isAvailable });
    }

    // Get labour details
    const labour = await User.findById(labourId);
    if (!labour) {
      return res.status(404).json({
        success: false,
        message: 'मजदूर नहीं मिला'
      });
    }

    // Check if labour has location data
    if (!labour.location || !labour.location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'प्रोफ़ाइल में स्थान नहीं मिला। कृपया पहले अपना स्थान अपडेट करें'
      });
    }

    // Check for existing requests and create new ones
    const createdRequests = [];
    const updatedRequests = [];
    const skippedDates = [];
    const errors = [];

    for (const { date: requestedDate, isAvailable } of validDates) {
      // Check if already submitted for this date
      const existingRequest = await LabourAvailability.findOne({
        labour: labourId,
        availabilityDate: requestedDate,
        status: 'active'
      });

      if (existingRequest) {
        // Update existing request with new availability status
        existingRequest.isAvailable = isAvailable;
        await existingRequest.save();
        updatedRequests.push({
          requestId: existingRequest._id,
          availabilityDate: existingRequest.availabilityDate,
          isAvailable: existingRequest.isAvailable
        });
        continue;
      }

      try {
        // Create availability request using labour's stored location
        const availabilityRequest = new LabourAvailability({
          labour: labourId,
          availabilityDate: requestedDate,
          availabilityType: 'specific_date',
          skills: labour.skills && labour.skills.length > 0 ? labour.skills.map(skill => skill._id) : [],
          location: {
            type: 'Point',
            coordinates: labour.location.coordinates,
            address: labour.addressLine1 || labour.location.address || ''
          },
          isAvailable: isAvailable
        });

        await availabilityRequest.save();
        createdRequests.push({
          requestId: availabilityRequest._id,
          availabilityDate: availabilityRequest.availabilityDate,
          isAvailable: availabilityRequest.isAvailable
        });

        // Find matching jobs and notify contractors only if available
        if (isAvailable) {
          await findAndNotifyMatchingJobs(availabilityRequest);
        }
      } catch (error) {
        errors.push(`${requestedDate.toDateString()}: ${error.message}`);
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: `उपलब्धता अनुरोध सफलतापूर्वक जमा किया गया`,
      data: {
        createdRequests: createdRequests,
        updatedRequests: updatedRequests,
        skippedDates: skippedDates,
        errors: errors,
        totalCreated: createdRequests.length,
        totalUpdated: updatedRequests.length,
        totalSkipped: skippedDates.length,
        totalErrors: errors.length,
        skills: labour.skills && labour.skills.length > 0 ? labour.skills.map(skill => skill.name) : []
      }
    };

    // Add warnings if some dates were updated, skipped or had errors
    if (updatedRequests.length > 0) {
      response.message += ` (${updatedRequests.length} तिथियां अपडेट की गईं)`;
    }
    if (skippedDates.length > 0) {
      response.message += ` (${skippedDates.length} तिथियां पहले से जमा हैं)`;
    }
    if (errors.length > 0) {
      response.message += ` (${errors.length} तिथियों में त्रुटि)`;
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error('Error in submitAvailabilityRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Find matching jobs and notify contractors
const findAndNotifyMatchingJobs = async (availabilityRequest) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find jobs that match the availability date and skills (if any)
    let jobQuery = {
      isActive: true,
      isFilled: false,
      validUntil: { $gte: today },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: availabilityRequest.location.coordinates
          },
          $maxDistance: 50000 // 50km radius
        }
      }
    };

    // Only filter by skills if the labour has skills
    if (availabilityRequest.skills && availabilityRequest.skills.length > 0) {
      jobQuery.skills = { $in: availabilityRequest.skills };
    }

    const matchingJobs = await JobPost.find(jobQuery)
      .populate('contractor', 'firstName lastName fcmToken')
      .populate('skills', 'name');

    console.log(`Found ${matchingJobs.length} matching jobs for labour availability`);

    // Store matched jobs
    availabilityRequest.matchedJobs = matchingJobs.map(job => ({
      job: job._id,
      contractor: job.contractor._id
    }));
    await availabilityRequest.save();

    // Send notifications to contractors
    for (const job of matchingJobs) {
      if (job.contractor.fcmToken) {
        const labour = await User.findById(availabilityRequest.labour);
        const skillNames = job.skills && job.skills.length > 0 
          ? job.skills.map(skill => skill.name).join(', ')
          : 'general work';
        
        await sendNotification(
          job.contractor.fcmToken,
          'Labour Available',
          `${labour.firstName} ${labour.lastName} is available ${availabilityRequest.availabilityType} for jobs requiring: ${skillNames}`
        );
      }
    }

  } catch (error) {
    console.error('Error in findAndNotifyMatchingJobs:', error);
  }
};

// Get labour's availability requests
const getMyAvailabilityRequests = async (req, res) => {
  try {
    const labourId = req.user.id;
    const { status = 'active' } = req.query;

    const query = { labour: labourId };
    if (status !== 'all') {
      query.status = status;
    }

    const requests = await LabourAvailability.find(query)
      .select('_id availabilityDate isAvailable status createdAt')
      .sort({ createdAt: -1 });

    // Format the response to match the submit format
    const formattedRequests = requests.map(request => ({
      requestId: request._id,
      availabilityDate: request.availabilityDate,
      isAvailable: request.isAvailable,
      status: request.status,
      createdAt: request.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: 'उपलब्धता अनुरोध सफलतापूर्वक प्राप्त किए गए',
      data: formattedRequests
    });

  } catch (error) {
    console.error('Error in getMyAvailabilityRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Cancel availability request
const cancelAvailabilityRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const labourId = req.user.id;

    const request = await LabourAvailability.findOne({
      _id: requestId,
      labour: labourId,
      status: 'active'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'उपलब्धता अनुरोध नहीं मिला या पहले से रद्द'
      });
    }

    request.status = 'cancelled';
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'उपलब्धता अनुरोध सफलतापूर्वक रद्द'
    });

  } catch (error) {
    console.error('Error in cancelAvailabilityRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Get availability status for specific date
const getAvailabilityStatus = async (req, res) => {
  try {
    const { date } = req.query;
    const labourId = req.user.id;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'तिथि पैरामीटर आवश्यक है (YYYY-MM-DD प्रारूप)'
      });
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'अमान्य तिथि प्रारूप। YYYY-MM-DD का उपयोग करें'
      });
    }

    requestedDate.setHours(0, 0, 0, 0);

    const availability = await LabourAvailability.findOne({
      labour: labourId,
      availabilityDate: requestedDate,
      status: 'active'
    });

    return res.status(200).json({
      success: true,
      message: 'उपलब्धता स्थिति सफलतापूर्वक प्राप्त',
      data: {
        date: requestedDate.toISOString().split('T')[0],
        isAvailable: !!availability,
        requestId: availability?._id || null,
        createdAt: availability?.createdAt || null,
        skills: availability?.skills || []
      }
    });

  } catch (error) {
    console.error('Error in getAvailabilityStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Toggle availability for specific date
const toggleAvailability = async (req, res) => {
  try {
    const { availabilityDate, longitude, latitude, address } = req.body;
    const labourId = req.user.id;

    // Validate input
    if (!availabilityDate) {
      return res.status(400).json({
        success: false,
        message: 'उपलब्धता तिथि आवश्यक है'
      });
    }

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'स्थान निर्देशांक आवश्यक हैं'
      });
    }

    // Validate date format and ensure it's not in the past
    const requestedDate = new Date(availabilityDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'अमान्य तिथि प्रारूप'
      });
    }

    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'पिछली तिथियों के लिए उपलब्धता टॉगल नहीं कर सकते'
      });
    }

    // Get labour details with skills
    const labour = await User.findById(labourId).populate('skills', 'name');
    if (!labour) {
      return res.status(404).json({
        success: false,
        message: 'मजदूर नहीं मिला'
      });
    }

    if (!labour.skills || labour.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'कोई कौशल नहीं मिला। कृपया पहले अपनी प्रोफ़ाइल में कौशल जोड़ें'
      });
    }

    // Normalize the date to start of day
    requestedDate.setHours(0, 0, 0, 0);

    // Check if already exists
    const existingRequest = await LabourAvailability.findOne({
      labour: labourId,
      availabilityDate: requestedDate,
      status: 'active'
    });

    if (existingRequest) {
      // Toggle off - cancel existing request
      existingRequest.status = 'cancelled';
      await existingRequest.save();

      return res.status(200).json({
        success: true,
        message: `Availability for ${requestedDate.toDateString()} has been turned OFF`,
        data: {
          isAvailable: false,
          requestId: existingRequest._id,
          availabilityDate: requestedDate
        }
      });
    } else {
      // Toggle on - create new request
      const availabilityRequest = new LabourAvailability({
        labour: labourId,
        availabilityDate: requestedDate,
        availabilityType: 'specific_date',
        skills: labour.skills.map(skill => skill._id),
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address: address || ''
        }
      });

      await availabilityRequest.save();

      // Find matching jobs and notify contractors
      await findAndNotifyMatchingJobs(availabilityRequest);

      return res.status(200).json({
        success: true,
        message: `Availability for ${requestedDate.toDateString()} has been turned ON`,
        data: {
          isAvailable: true,
          requestId: availabilityRequest._id,
          availabilityDate: requestedDate,
          skills: labour.skills.map(skill => skill.name)
        }
      });
    }

  } catch (error) {
    console.error('Error in toggleAvailability:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Get available labourers for contractors by date
const getAvailableLaboursByDate = async (req, res) => {
  try {
    const { date, skills, longitude, latitude, maxDistance = 50000 } = req.query;
    const contractorId = req.user.id;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'तिथि पैरामीटर आवश्यक है (YYYY-MM-DD प्रारूप)'
      });
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'अमान्य तिथि प्रारूप। YYYY-MM-DD का उपयोग करें'
      });
    }

    requestedDate.setHours(0, 0, 0, 0);

    let query = {
      status: 'active',
      availabilityDate: requestedDate,
      isAvailable: true
    };

    // Only filter by skills if skills parameter is provided
    if (skills) {
      const skillNames = Array.isArray(skills) ? skills : skills.split(',');
      
      // Find skill ObjectIds by names
      const skillObjects = await Skill.find({ 
        name: { $in: skillNames }, 
        isActive: true 
      });
      
      if (skillObjects.length > 0) {
        const skillIds = skillObjects.map(skill => skill._id);
        query.skills = { $in: skillIds };
      }
    }

    // Add location filter if coordinates provided
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    const availableLabours = await LabourAvailability.find(query)
      .sort({ createdAt: -1 });

    // Manually populate labour data
    const populatedLabours = await Promise.all(availableLabours.map(async (labour) => {
      const labourData = await User.findById(labour.labour).select('firstName lastName phoneNumber profilePicture');
      const skillsData = await Skill.find({ _id: { $in: labour.skills } }).select('name nameHindi');
      
      return {
        ...labour.toObject(),
        labour: labourData,
        skills: skillsData
      };
    }));

    return res.status(200).json({
      success: true,
      message: `Available labourers for ${requestedDate.toDateString()} fetched successfully`,
      data: {
        date: requestedDate.toISOString().split('T')[0],
        count: populatedLabours.length,
        labourers: populatedLabours
      }
    });

  } catch (error) {
    console.error('Error in getAvailableLaboursByDate:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Get available labourers for contractors (all dates)
const getAvailableLabours = async (req, res) => {
  try {
    console.log("=== getAvailableLabours - Advanced Filters ===");

    const contractorId = req.user.id;
    const {
      latitude,
      longitude,
      maxDistance = 15000,
      skillId,
      work_category,
      availabilityDate
    } = req.query;

    // ✅ Validate lat/lon
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required.",
      });
    }

    // ✅ Fetch contractor (for category match fallback)
    const contractor = await User.findById(contractorId).select("work_category");
    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found.",
      });
    }

    // ✅ Prepare date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = availabilityDate ? new Date(availabilityDate) : today;

    // ✅ Base query
    let query = {
      status: "active",
      isAvailable: true,
      availabilityDate: { $gte: selectedDate },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance), // meters
        },
      },
    };

    // ✅ Optional filters
    if (skillId) query.skills = { $in: [skillId] };
    if (work_category) query.work_category = work_category;

    console.log("MongoDB Query:", JSON.stringify(query, null, 2));

    // ✅ Fetch nearby available labours
    const labourAvailabilityList = await LabourAvailability.find(query)
      .sort({ availabilityDate: 1, createdAt: -1 });

    console.log("Available labours found:", labourAvailabilityList.length);

    // ✅ Populate user + skill info
    let populatedLabours = await Promise.all(
      labourAvailabilityList.map(async (availability) => {
        const labourData = await User.findById(availability.labour).select(
          "firstName lastName phoneNumber profilePicture work_category skills location"
        );

        if (!labourData) return null;

        const skillsIds = availability.skills?.length > 0
          ? availability.skills
          : labourData.skills || [];

        const skillsData = skillsIds.length
          ? await Skill.find({ _id: { $in: skillsIds } }).select("name nameHindi")
          : [];

        return {
          ...availability.toObject(),
          labour: labourData,
          skills: skillsData,
        };
      })
    );

    // ✅ Remove nulls (if any labour deleted)
    populatedLabours = populatedLabours.filter(Boolean);

    // ✅ If work_category not passed, filter by contractor category
    if (!work_category) {
      populatedLabours = populatedLabours.filter(
        (item) =>
          item.labour?.work_category &&
          item.labour.work_category === contractor.work_category
      );
    }

    console.log("Filtered count (final):", populatedLabours.length);

    return res.status(200).json({
      success: true,
      message: "उपलब्ध मजदूर सफलतापूर्वक प्राप्त",
      count: populatedLabours.length,
      data: populatedLabours,
    });
  } catch (error) {
    console.error("❌ Error in getAvailableLabours:", error);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};


// Get all labour availability requests (Admin only)
const getAllLabourAvailabilityRequests = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const availabilityRequests = await LabourAvailability.find(query)
      .populate({
        path: 'labour',
        model: 'User',
        select: 'firstName lastName phoneNumber profilePicture'
      })
      .populate('skills', 'name nameHindi category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LabourAvailability.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'मजदूर उपलब्धता अनुरोध सफलतापूर्वक प्राप्त',
      data: {
        requests: availabilityRequests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Error in getAllLabourAvailabilityRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

module.exports = {
  submitAvailabilityRequest,
  getMyAvailabilityRequests,
  cancelAvailabilityRequest,
  getAvailableLabours,
  getAvailableLaboursByDate,
  getAvailabilityStatus,
  toggleAvailability,
  getAllLabourAvailabilityRequests
};
