const Service = require("../models/serviceCategoryModel");
const Stylist = require("../models/hairStylistModel");
const SubService = require("../models/subServiceModel");

// create service
const createService = async (req, res) => {
    try {
        const { name, maxPrice, minPrice, isActive } = req.body;

        const fileUrls = req.fileLocations[0];

        const existingService = await Service.findOne({ name: name });
        if (existingService) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Service already exists!"
            });
        }

        const newService = new Service({ name, maxPrice, minPrice, isActive, icon: fileUrls });
        await newService.save();

        res.status(201).json({
            success: true,
            status: 201,
            message: "Service created successfully!",
            data: newService
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

// get services
const getServices = async (req, res) => {
    try {
        const allServices = await Service.find();
        if (!allServices || allServices.length === 0) {
            return res.status(200).json({
                success: true,
                status: 200,
                message: "No services found!",
                data: allServices
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Services fetched successfully!",
            allServices,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message,
        });
    }
};

// get active services
const getActiveServices = async (req, res) => {
    try {
        const activeServices = await Service.find({ isActive: true });

        res.status(200).json({
            success: true,
            status: 200,
            message: activeServices.length === 0 ? "No active services found!" : "Service categories fetched successfully!",
            data: activeServices
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


// modify the delete when it is selected by stylists it has to be deleted from the stylists also
// delete service
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByIdAndDelete(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Service not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Service deleted successfully!"
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

// activate/deactivate service
const activateService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);
        if (!service) {
            return res.json({
                success: false,
                status: 404,
                message: "Service not found!",
            });
        }

        service.isActive = !service.isActive;

        await service.save();

        res.json({
            success: true,
            status: 200,
            message: `Service ${service.isActive ? "activated" : "deactivated"} successfully! `
        })
    }
    catch (error) {
        return res.json({
            success: false,
            status: 500,
            message: error.message
        })
    }
};

// Subservice APIs

// create subservices
const createSubservice = async (req, res) => {
    try {
        // const serviceId = req.params.id;
        const { serviceId, name } = req.body;

        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Service not found!"
            });
        }

        const subService = await SubService.findOne({ service: serviceId, name: name });
        if (subService) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Subservice already exists!"
            })
        }

        await SubService.create({
            service: serviceId,
            name
        });

        res.status(200).json({
            success: true,
            status: 200,
            message: "Subservice created successfully!"
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

// get subservices
const getSubServices = async (req, res) => {
    try {
        const subServices = await SubService.find().populate("service", "name");

        res.status(200).json({
            success: true,
            status: 200,
            message: subServices.length === 0 ? "No Subservices found!" : "Subservices fetched successfully!",
            data: subServices
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

// get active subservices
const getActiveSubServices = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const subServices = await SubService.find({
            service: serviceId
        }).populate({
            path: 'service',
            match: { isActive: true }
        });

        res.status(200).json({
            success: true,
            status: 200,
            message: subServices.length === 0 ? "No Subservices found!" : "Subservices fetched successfully!",
            data: subServices
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

// delete subservice 
const deleteSubService = async (req, res) => {
    try {
        const subServiceId = req.params.id;

        const subService = await SubService.findByIdAndDelete(subServiceId);
        if (!subService) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Subservice not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Subservice deleted successfully!"
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

// get subservices on the basis of service
const getSubServicesByService = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const subServices = await SubService.find({ service: serviceId });

        res.status(200).json({
            success: true,
            status: 200,
            message: subServices.length === 0 ? "No subservices found!" : "Subservices fetched successfully!",
            data: subServices
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

module.exports = {
    createService,
    getServices,
    getActiveServices,
    deleteService,
    activateService,
    getSubServicesByService,
    createSubservice,
    deleteSubService,
    getSubServices,
    getActiveSubServices
}