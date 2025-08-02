const Stylist = require("../models/hairStylistModel");
const Service = require("../models/serviceCategoryModel");
const { calculateDistance, determineScheduleType } = require('../utils/determineScheduleType');
// const SubService = require("../models/subServiceModel");
const StylistAvailability = require("../models/stylistAvailabilityModel");
const mongoose = require('mongoose');
const Appointment = require("../models/appointmentModel");
const { sendEmail } = require("../service/emailService");
const ObjectId = mongoose.Types.ObjectId;
const Review = require("../models/reviewModel");
// create stylist profile
const updateStylistProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { education, expertise, experience, instagramLink, facebookLink, linkedinLink, address, locationCategory, profileCompletionStep, parking,
      busStop } = req.body;

    // Validate expertise IDs if needed
    if (expertise && !Array.isArray(expertise)) {
      return res.status(400).json({ error: "Expertise must be an array" });
    }

    // Prepare the update object
    const updateData = {
      education,
      expertise,
      experience,
      "socialMediaLinks.facebook": facebookLink,
      "socialMediaLinks.instagram": instagramLink,
      "socialMediaLinks.linkedin": linkedinLink,
      address,
      profileCompletionStep
    };

    // Handle location update
    if (locationCategory) {
      updateData["location.category"] = locationCategory;

      // If category is "own", update the additional details
      if (locationCategory === "own") {
        updateData["location.details"] = {
          parking: parking || false,
          busStop: busStop || false
        };
      }
    }

    const updatedStylist = await Stylist.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: updatedStylist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 500,
      error: error.message
    });
  }
};

const handleCertificateUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const fileUrls = req.fileLocations || [];
    const { profileCompletionStep } = req.body

    if (fileUrls.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // const completion = profileCompletionStep === "certifications" ? return res.status(400).json({message: "Invalid step!"}); : next();

    const certificates = fileUrls.map(url => ({
      url,
      name: req.files.find(f => url.includes(f.originalname)).originalname,
      verified: false
    }));

    await Stylist.findByIdAndUpdate(
      id,
      {
        $push: {
          certificates: { $each: certificates },
          profileCompletionStep
        }
      }
    );

    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handlePortfolioUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const { descriptions, profileCompletionStep } = req.body; // Expects an array
    const fileUrls = req.fileLocations || [];

    if (fileUrls.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    let parsedDescriptions;
    try {
      parsedDescriptions = typeof descriptions === 'string' ? JSON.parse(descriptions) : descriptions;
    } catch (err) {
      parsedDescriptions = [descriptions]; // fallback: treat single plain string as one description
    }

    // Validate descriptions length matches files length
    if (!parsedDescriptions || parsedDescriptions.length !== req.files.length) {

      return res.status(400).json({
        error: "Provide one description per file in an array",
        expected: req.files.length,
        received: parsedDescriptions?.length || 0,
      });
    }

    const Portfolio = req.files.map((file, index) => ({
      url: fileUrls.find((url) => url.includes(file.originalname)),
      name: file.originalname,
      description: parsedDescriptions[index], // Assign individual description
      mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video',
    }));

    const stylist = await Stylist.findByIdAndUpdate(
      id,
      {
        $push: { portfolio: { $each: Portfolio } },
        profileCompletionStep
      }
    );

    res.json({ success: true, data: stylist.portfolio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// remove portfolio or certificate item
const removeStylistDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { type } = req.query; // type can be 'certificate', 'portfolio', 'photo', 'experience', or 'expertise'

    if (!['certificate', 'portfolio', 'photo', 'experience', 'expertise'].includes(type)) {
      return res.status(400).json({ error: "Type must be either 'certificate', 'portfolio', 'photo', 'experience', or 'expertise'" });
    }

    let updateField;
    if (type === 'certificate') updateField = 'certificates';
    else if (type === 'portfolio') updateField = 'portfolio';
    else if (type === 'photo') updateField = 'photos';
    else if (type === 'experience') updateField = 'experience';
    else if (type === 'expertise') updateField = 'expertise';

    let updateQuery;
    if (type === 'expertise') {
      // Remove the string from the expertise array
      updateQuery = { $pull: { expertise: docId } };
    } else {
      // Remove by _id for all other types
      updateQuery = { $pull: { [updateField]: { _id: docId } } };
    }

    const updatedStylist = await Stylist.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true }
    );

    if (!updatedStylist) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.status(200).json({
      success: true,
      message: `${type} removed successfully`,
      data: updatedStylist[updateField]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// approve stylist
const approveStylist = async (req, res) => {
  try {
    const stylistId = req.params.stylistId;

    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!"
      });
    }

    stylist.isApproved = !stylist.isApproved;
    await stylist.save();

    res.status(200).json({
      success: true,
      statsu: 200,
      message: `Stylist ${stylist.isApproved ? "activated" : "deactivated"} successfully!`
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
}

const getAllStylists = async (req, res) => {
  try {
    const stylists = await Stylist.find().select("-password");
    res.status(200).json({
      success: true,
      status: 200,
      message: stylists.length === 0 ? "No stylists found!" : "Stylists fetched successfully!",
      data: stylists
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

const deleteStylist = async (req, res) => {
  try {
    const stylistId = req.params.id;
    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!"
      });
    }
    await Stylist.findByIdAndDelete(stylistId);

    res.status(200).json({
      success: true,
      status: 200,
      message: "Stylist deleted successfully!"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

const searchStylists = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Search query is required"
      });
    }
    const stylists = await Stylist.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select("-password");
    res.status(200).json({
      success: true,
      status: 200,
      message: stylists.length ? "Stylists found" : "No stylists found",
      data: stylists
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};


// add profile image
const updateProfileImage = async (req, res) => {
  try {
    const stylistId = req.user.id;
    const fileUrl = req.fileLocations[0];

    const stylist = await Stylist.findByIdAndUpdate(stylistId,
      { profilePicture: fileUrl },
      { new: true });

    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!"
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Stylist updated successfully!",
      profilePicture: stylist.profilePicture
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
}

// update stylist location
const updateStylistLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    await Stylist.findByIdAndUpdate(req.user.id, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        lastUpdated: new Date()
      }
    });

    res.status(200).json({ success: true, status: 200, message: "Location Updated!" });
  } catch (err) {
    res.status(500).json({ success: false, status: 500, message: err.message });
  }
};

// get activated stylists
const getActiveStylists = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, limit = 20 } = req.query;

    // Validate coordinates
    if ((lat && !lng) || (!lat && lng)) {
      return res.status(400).json({
        success: false,
        message: "Both latitude and longitude are required"
      });
    }

    // Base query
    const query = { isApproved: true };
    let sortOption = {};

    // Geospatial query when coordinates exist
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    } else {
      // Default sort by rating when no location
      sortOption = { rating: -1 };
    }

    // Execute query with proper location filtering
    let stylists = await Stylist.find(query)
      .select('-password -__v') // Exclude sensitive/uneeded fields
      .sort(sortOption)
      .limit(parseInt(limit))
      .lean();

    // Calculate distances if coordinates provided
    if (lat && lng) {

      stylists = stylists.map(stylist => ({
        ...stylist,
        distance: calculateDistance(
          [parseFloat(lat), parseFloat(lng)],
          [stylist.location.coordinates[1], stylist.location.coordinates[0]]
        )
      }));

      // Secondary sort by rating if same distance
      stylists.sort((a, b) => {
        if (a.distance === b.distance) {
          return b.rating - a.rating;
        }
        return a.distance - b.distance;
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      count: stylists.length,
      data: stylists
    });

  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Server error while fetching stylists",
      error: error.message
    });
  }
};

// get stylist by id
const getStylistById = async (req, res) => {
  try {
    const id = req.query.id ? req.query.id : req.user.id;
    let aggregation = [];

    aggregation.push({
      $match: {
        _id: new ObjectId(id)
      }
    });

    aggregation.push({
      $project: {
        password: 0,
        refreshToken: 0,
        __v: 0
      }
    });

    aggregation.push({
      $unwind: {
        path: "$services",
        preserveNullAndEmptyArrays: true
      }
    });

    // 🔄 Lookup actual service data from "services" collection
    aggregation.push({
      $lookup: {
        from: "services",
        localField: "services.serviceId",
        foreignField: "_id",
        as: "serviceInfo"
      }
    });

    aggregation.push({
      $unwind: {
        path: "$serviceInfo",
        preserveNullAndEmptyArrays: true
      }
    });

    // Add service name to the services array item
    aggregation.push({
      $addFields: {
        "services.serviceName": "$serviceInfo.name"
      }
    });

    // Optional: Lookup subservice if needed
    aggregation.push({
      $lookup: {
        from: "subservices",
        localField: "services.subService",
        foreignField: "_id",
        as: "subServiceInfo"
      }
    });

    aggregation.push({
      $unwind: {
        path: "$subServiceInfo",
        preserveNullAndEmptyArrays: true
      }
    });

    aggregation.push({
      $addFields: {
        "services.subServiceName": "$subServiceInfo.name"
      }
    });

    // Group back to array of services
    aggregation.push({
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        services: { $push: "$services" }
      }
    });

    aggregation.push({
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$doc", { services: "$services" }]
        }
      }
    });

    const stylistData = await Stylist.aggregate(aggregation);

    // Fetch all reviews for the stylist
    const reviewDoc = await Review.findOne({ entityType: 'stylist' });
    let reviews = [];
    let averageRating = 0;
    let reviewCount = 0;
    if (reviewDoc) {
      reviews = reviewDoc.review.filter(r => r.reviewed.toString() === id && r.isVisible === true);
      reviewCount = reviews.length;
      if (reviewCount > 0) {
        averageRating = reviews.reduce((sum, r) => sum + (r.ratings || 0), 0) / reviewCount;
        averageRating = Math.round(averageRating * 100) / 100; // round to 2 decimals
      }
      // Populate user name and profileImage
      const User = require('../models/userModel');
      const userIds = reviews.map(r => r.user);
      const users = await User.find({ _id: { $in: userIds } }).select('fullName profileImage');
      const userMap = {};
      users.forEach(u => { userMap[u._id.toString()] = u; });
      reviews = reviews.map(r => ({
        ...r.toObject(),
        userName: userMap[r.user.toString()]?.fullName || '',
        userProfileImage: userMap[r.user.toString()]?.profileImage || ''
      }));
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Stylist fetched successfully!",
      data: {
        ...stylistData[0],
        reviews,
        averageRating,
        reviewCount
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// update shop details
const updateShopDetails = async (req, res) => {
  try {
    // const { id } = req.params.id;
    const id = req.user.id;
    const {
      shopName,
      startFrom,
      about,
      address,
      schedule,
      timings,
      coordinates,
      customDays
    } = req.body;

    // Validate required fields
    if (!shopName || !address) {
      return res.status(400).json({
        success: false,
        message: "Shop name and address are required"
      });
    }

    const stylist = await Stylist.findById(id);
    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: "Stylist not found"
      });
    }

    // Build update object
    const updateData = {
      'about.shopName': shopName,
      'about.startFrom': startFrom,
      'about.about': about,
      'about.address': address,
      'about.schedule': determineScheduleType(customDays), // New helper function
      'about.customDays': schedule === 'Custom' ? customDays : undefined,
      'about.timings': timings ? {
        from: timings.from,
        till: timings.till
      } : undefined,
    };

    // Handle location if coordinates provided
    if (coordinates && coordinates.length === 2) {
      updateData['location.coordinates'] = coordinates;
      updateData['location.lastUpdated'] = new Date();
    }

    const updatedStylist = await Stylist.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true // Ensures schema validations run
      }
    ).select('-password -refreshToken -otp');

    if (!updatedStylist) {
      return res.status(404).json({
        success: false,
        message: "Stylist not found"
      });
    }

    res.json({
      success: true,
      message: "Shop details updated successfully",
      data: updatedStylist.about
    });

  } catch (error) {
    console.error("Update shop error:", error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// update photos
const addPhotos = async (req, res) => {
  try {
    const id = req.user.id;
    const fileUrls = req.fileLocations || [];

    if (fileUrls.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Verify stylist exists
    const stylist = await Stylist.findById(id);
    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found"
      });
    }

    // Prepare new photos with metadata
    const newPhotos = fileUrls.map((url, index) => ({
      url,
      name: req.files[index]?.originalname || `photo-${Date.now()}-${index}`,
      uploadedAt: new Date(),
      verified: false
    }));

    const updatedStylist = await Stylist.findByIdAndUpdate(
      id,
      { $push: { photos: { $each: newPhotos } } },
      {
        new: true,
        runValidators: true
      }
    ).select('photos');

    res.json({
      success: true,
      status: 200,
      message: `${fileUrls.length} photos added successfully`,
      data: updatedStylist.photos
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

const addService = async (req, res) => {
  try {
    const { serviceId, subServiceId, price, duration } = req.body;
    const stylistId = req.user.id;

    // Validate input
    if (!serviceId || !subServiceId || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate service exists and is active
    const service = await Service.findOne({
      _id: serviceId,
      isActive: true
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    if (price <= service.maxPrice && price >= service.minPrice) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `Price should be between ${service.maxPrice} and ${service.minPrice}`
      });
    }

    // Check if expertise already exists
    const existingExpertise = await Stylist.findOne({
      _id: stylistId,
      'services.service': serviceId,
      'services.subService': subServiceId
    });

    let updatedStylist;
    if (existingExpertise) {
      // Update existing expertise
      updatedStylist = await Stylist.findOneAndUpdate(
        {
          _id: stylistId,
          'services.service': serviceId,
          'services.subService': subServiceId
        },
        {
          $set: {
            'services.$.price': price,
            'services.$.duration': duration,
            'services.$.isActive': true
          }
        },
        { new: true }
      );
    } else {
      // Add new expertise
      updatedStylist = await Stylist.findByIdAndUpdate(
        stylistId,
        {
          $push: {
            services: {
              service: serviceId,
              subService: subServiceId,
              price,
              duration,
              isActive: true
            }
          }
        },
        { new: true }
      );
    }

    const populatedStylist = await Stylist.findById(stylistId)
      .populate('services.service')
      .populate('services.subService');

    res.status(201).json({
      success: true,
      message: "Subservice successfully created!",
      data: populatedStylist.services
    });

  } catch (error) {
    console.error('Error in addService:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get services
const getServices = async (req, res) => {
  try {
    const stylistId = req.query.id ? req.query.id : req.user.id;

    const stylist = await Stylist.findById(stylistId)
      .populate("services.service", "name")
      .populate("services.subService", "name")
      .lean();
    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!"
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Services fetched successfully!",
      data: stylist.services
    })
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// toggle services
const toggleService = async (req, res) => {
  try {
    const stylistId = req.user.id;
    const subServiceId = req.params.id;

    const stylist = await Stylist.findOne({ _id: stylistId, "services.subService": subServiceId });
    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!"
      });
    }

    const service = stylist.services.map((index) => {
      if (index.subService === subServiceId) {
        service.isActive = !service.isActive;
      }
    });


    await stylist.save();

    res.status(200).json({
      success: true,
      status: 200,
      message: `Subservice ${service ? "Activated" : "Deactivated"} successfully!`,
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// add experience
const addExperience = async (req, res) => {
  try {
    const stylistId = req.user.id;
    const { newExperience } = req.body;

    const stylist = await Stylist.findByIdAndUpdate(stylistId,
      {
        $push: {
          experience: newExperience
        }
      },
      { new: true }
    );

    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Stylist updated successfully!",
      data: stylist
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

const addExpertise = async (req, res) => {
  try {
    const stylistId = req.user.id;
    const { expertise } = req.body;

    // Validate input
    if (!expertise || !Array.isArray(expertise) || expertise.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Expertise must be a non-empty array of strings."
      });
    }

    // Add new expertise, avoiding duplicates
    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Stylist not found!"
      });
    }

    // Merge and deduplicate
    const currentExpertise = Array.isArray(stylist.expertise) ? stylist.expertise : [];
    const updatedExpertise = Array.from(new Set([...currentExpertise, ...expertise]));
    stylist.expertise = updatedExpertise;
    await stylist.save();

    res.status(200).json({
      success: true,
      status: 200,
      message: "Expertise updated successfully!",
      data: stylist.expertise
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// get stylist service category wise
const getStylistByServiceCategory = async (req, res) => {
  try {
    const stylists = await Stylist.find({ "services.serviceId": req.params.serviceId }).select("fullName about.timings profilePicture");

    res.status(200).json({
      success: true,
      status: 200,
      message: stylists.length === 0 ? "No Stylists found!" : "Stylists fetched successfully!",
      data: stylists
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// ------------------------------------Availability Management----------------------------------------------
const addAvailability = async (req, res) => {
  try {
    // req.user.id ||
    const stylistId = req.params.id;
    const { availability } = req.body;

    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be a non-empty array.',
        statusCode: 400
      });
    }
    const slot24hRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const slot12hRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] ?([AaPp][Mm])$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    function to24Hour(time) {
      if (slot24hRegex.test(time)) return time;
      const match = time.match(/^(0?[1-9]|1[0-2]):([0-5][0-9]) ?([AaPp][Mm])$/);
      if (!match) return null;
      let [_, hour, minute, period] = match;
      hour = parseInt(hour, 10);
      if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return hour.toString().padStart(2, '0') + ':' + minute;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Validate and process each availability entry
    const processedAvailability = availability.map(dateObj => {
      if (!dateObj.date || !dateRegex.test(dateObj.date)) {
        throw new Error('Each availability entry must have a valid date in YYYY-MM-DD format.');
      }
      if (new Date(dateObj.date) < new Date(todayStr)) {
        throw new Error(`Cannot set availability for past date: ${dateObj.date}`);
      }
      let slots = dateObj.slots;
      if (!Array.isArray(slots) || slots.length === 0) {
        throw new Error('Each availability entry must have a non-empty slots array.');
      }
      const convertedSlots = slots.map(slot => {
        let from = slot.from;
        let till = slot.till;
        if (slot12hRegex.test(from)) from = to24Hour(from);
        if (slot12hRegex.test(till)) till = to24Hour(till);
        if (!from || !till || !slot24hRegex.test(from) || !slot24hRegex.test(till)) {
          throw new Error('Each slot must have valid from and till times in HH:MM 24-hour format or HH:MM AM/PM.');
        }
        if (dateObj.date === todayStr) {
          const [tillHour, tillMin] = till.split(':').map(Number);
          const tillTime = new Date();
          tillTime.setHours(tillHour, tillMin, 0, 0);
          if (tillTime <= now) {
            throw new Error(`Cannot set slot ${from}-${till} for today, as it is already expired.`);
          }
        }
        return { from, till };
      });
      return {
        date: dateObj.date,
        slots: convertedSlots,
        isActive: dateObj.isActive !== undefined ? dateObj.isActive : true
      };
    });

    // Upsert each date's availability for the stylist
    const upserted = [];
    for (const entry of processedAvailability) {
      const updated = await StylistAvailability.findOneAndUpdate(
        { stylistId, date: entry.date },
        { $set: { slots: entry.slots, isActive: entry.isActive } },
        { upsert: true, new: true, runValidators: true }
      );
      upserted.push(updated);
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully.',
      data: upserted,
      statusCode: 200
    });
  } catch (error) {
    const isValidationError =
      error.message?.includes('Cannot set availability for past date') ||
      error.message?.includes('Each availability entry must have') ||
      error.message?.includes('Each slot must have') ||
      error.message?.includes('Cannot set slot');
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: error.message,
      statusCode: isValidationError ? 400 : 500
    });
  }
};

const getAvailability = async (req, res) => {
  try {
    const stylistId = req.query.stylistId || req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toTimeString().slice(0, 5); // HH:MM format

    const expiredDocs = await StylistAvailability.aggregate([
      {
        $match: {
          stylistId: new mongoose.Types.ObjectId(stylistId),
          date: { $lt: todayStr }
        }
      }
    ]);
    const expiredIds = expiredDocs.map(doc => doc._id);
    if (expiredIds.length > 0) {
      await StylistAvailability.deleteMany({ _id: { $in: expiredIds } });
    }

    const availability = await StylistAvailability.aggregate([
      {
        $match: {
          stylistId: new mongoose.Types.ObjectId(stylistId)
        }
      },
      {
        $sort: { date: 1 }
      },
      {
        $addFields: {
          slots: {
            $filter: {
              input: {
                $sortArray: {
                  input: "$slots",
                  sortBy: { from: 1 }
                }
              },
              as: "slot",
              cond: {
                $or: [
                  { $ne: ["$date", todayStr] }, // Keep all slots for future dates
                  {
                    $gt: ["$$slot.till", currentTimeStr] // For today, keep only slots with till > current time
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          isActive: 1,
          slots: {
            from: 1,
            till: 1
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Availability fetched successfully.',
      data: availability
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete an entire availability entry for a given date
const deleteAvailability = async (req, res) => {
  try {
    const stylistId = req.user.id;
    const { date } = req.params;
    const deleted = await StylistAvailability.findOneAndDelete({ stylistId, date });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Availability not found.' });
    }
    res.status(200).json({ success: true, message: 'Availability deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a specific slot within a given date
const deleteAvailabilitySlot = async (req, res) => {
  try {
    const stylistId = req.user.id;
    const { date } = req.params;
    const { from, till } = req.body;

    if (!from || !till) {
      return res.status(400).json({ success: false, message: 'Both from and till times are required.' });
    }

    // Remove the specific slot
    const updated = await StylistAvailability.findOneAndUpdate(
      { stylistId, date },
      { $pull: { slots: { from, till } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Availability or date not found.' });
    }

    // If no slots remain, delete the entire availability for that date
    if (updated.slots.length === 0) {
      await StylistAvailability.findOneAndDelete({ stylistId, date });
      return res.status(200).json({
        success: true,
        message: 'Slot deleted. No more slots left, so availability for the date is also deleted.',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Slot deleted.',
      data: updated
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStep1 = async (req, res) => {
  const { id } = req.params;
  const { socialMediaLinks, address } = req.body;

  try {
    await Stylist.findByIdAndUpdate(id, {
      socialMediaLinks,
      address,
      profileCompletionStep: "serviceLocation",
      isProfileCompleted: false
    });

    res.json({ success: true, message: "Step 1 completed", nextStep: "serviceLocation", statusCode: 200 });

  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
}

const updateStep2 = async (req, res) => {
  const { id } = req.params;
  const { serviceLocation } = req.body;

  try {
    await Stylist.findByIdAndUpdate(id, {
      serviceLocation,
      profileCompletionStep: "portfolio",
      isProfileCompleted: false
    });

    res.json({ success: true, message: "Step 2 completed", nextStep: "portfolio", statusCode: 200 });

  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
}

const updateStep3 = async (req, res) => {
  const { id } = req.params;
  const fileUrls = req.fileLocations || [];

  try {
    const portfolioEntries = fileUrls.map(url => ({ url }));
    await Stylist.findByIdAndUpdate(id, {
      $push: { portfolio: { $each: portfolioEntries } },
      profileCompletionStep: "services",
      isProfileCompleted: false
    });

    res.json({
      success: true,
      message: "Step 3 (portfolio) completed",
      nextStep: "services",
      statusCode: 200
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
}

const updateStep4 = async (req, res) => {
  const { id } = req.params;
  const { services } = req.body;

  try {
    await Stylist.findByIdAndUpdate(id, {
      services,
      profileCompletionStep: "availability",
      isProfileCompleted: false
    });

    res.json({
      success: true,
      message: "Step 4 (services) completed",
      nextStep: "availability",
      statusCode: 200
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

const updateStep5 = async (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;
  try {
    const dates = availability.map(a => a.date);
    await StylistAvailability.deleteMany({ stylistId: id, date: { $in: dates } });

    const availabilityData = availability.map(entry => ({
      stylistId: id,
      date: entry.date,
      slots: entry.slots,
      isActive: entry.isActive ?? true
    }));

    await StylistAvailability.insertMany(availabilityData);

    await Stylist.findByIdAndUpdate(id, {
      profileCompletionStep: "specialities",
      isProfileCompleted: false
    });

    res.json({
      success: true,
      message: "Step 5 (availability) completed",
      nextStep: "specialities",
      statusCode: 200
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
}

const updateStep6 = async (req, res) => {
  const { id } = req.params;
  const { specialities } = req.body;

  try {
    await Stylist.findByIdAndUpdate(id, {
      specialities,
      profileCompletionStep: "certifications",
      isProfileCompleted: false
    });

    res.json({
      success: true,
      message: "Step 4 (specialities) completed",
      nextStep: "certifications",
      statusCode: 200
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

const updateStep7 = async (req, res) => {
  const { id } = req.params;
  const fileUrls = req.fileLocations || [];

  try {
    const certificates = fileUrls.map(url => ({ url }));
    await Stylist.findByIdAndUpdate(id, {
      $push: { certificates: { $each: certificates } },
      profileCompletionStep: "completed",
      isProfileCompleted: true
    });

    res.json({
      success: true,
      message: "Step 3 (portfolio) completed",
      nextStep: "services",
      statusCode: 200
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
}


module.exports = {
  updateStylistProfile,
  handleCertificateUpload,
  handlePortfolioUpload,
  approveStylist,
  getAllStylists,
  deleteStylist,
  searchStylists,
  updateStylistLocation,
  getActiveStylists,
  getStylistById,
  updateShopDetails,
  addPhotos,
  addService,
  updateProfileImage,
  addExperience,
  getServices,
  toggleService,
  getStylistByServiceCategory,
  removeStylistDocument,
  addExpertise,
  addAvailability,
  getAvailability,
  deleteAvailability,
  deleteAvailabilitySlot,
  updateStep1,
  updateStep2,
  updateStep3,
  updateStep4,
  updateStep5,
  updateStep6,
  updateStep7
}