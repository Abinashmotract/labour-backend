
const Package = require("../models/packageModel");
const Stylist = require("../models/hairStylistModel");

// create package
const createPackage = async (req, res) => {
    try {
        const { title, about, serviceId, price, subServiceId, date, duration, discount } = req.body
        const stylistId = req.user.id;

        const subServiceArray = typeof subServiceId === 'string' ? JSON.parse(subServiceId) : subServiceId;
        // const dateArray = typeof date === 'string' ? JSON.parse(date) : date;
        let dateArray = [];

        if (typeof date === 'string') {
            try {
                const parsed = JSON.parse(date);
                dateArray = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                dateArray = [date];
            }
        } else {
            dateArray = Array.isArray(date) ? date : [date];
        }


        // const stylist = await Stylist.findById(stylistId);

        const existingPackage = await Package.findOne({ stylist: stylistId, title: title });
        if (existingPackage) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Package already exist!"
            });
        }

        // let totalPrice = 0;
        // subServiceArray.forEach(id => {
        //     const matched = stylist.services.subServices.find(sub => sub._id.toString() === id);
        //     if (matched && matched.price) {
        //         totalPrice += matched.price;
        //     }
        // });

        const fileUrl = req.fileLocations[0];

        const newPackage = await Package.create({
            stylist: stylistId,
            title,
            about,
            serviceId: serviceId,
            subService: subServiceArray,
            date: dateArray,
            price,
            // price: totalPrice,
            duration,
            discount,
            coverImage: fileUrl
        });

        res.status(201).json({
            success: true,
            status: 201,
            message: "Successfully created package!",
            data: newPackage
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

// get packages
const getPackage = async (req, res) => {
    try {
        const packages = await Package.find().populate('subService', 'name');

        res.status(200).json({
            success: true,
            status: 200,
            message: packages.length === 0 ? "No packages found!" : "Packages fetched successfully!",
            data: packages
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

// delete package
const deletePackage = async (req, res) => {
    try {
        const packageId = req.params.id;

        const package = await Package.findByIdAndDelete(packageId);
        if (!package) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Package not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Package deleted successfully!"
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

// update package
const updatePackageByStylist = async (req, res) => {
    try {
        const packageId = req.params.id;
        const stylistId = req.user.id;

        // Find the package and ensure it belongs to the stylist
        const existingPackage = await Package.findOne({ _id: packageId, stylist: stylistId });
        if (!existingPackage) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Package not found or you do not have permission to update this package!"
            });
        }

        // Prepare update fields
        const {
            title,
            about,
            serviceId,
            price,
            subServiceId,
            date,
            duration,
            discount
        } = req.body;

        let subServiceArray = existingPackage.subService;
        if (typeof subServiceId !== 'undefined') {
            subServiceArray = typeof subServiceId === 'string' ? JSON.parse(subServiceId) : subServiceId;
        }

        let dateArray = existingPackage.date;
        if (typeof date !== 'undefined') {
            if (typeof date === 'string') {
                try {
                    const parsed = JSON.parse(date);
                    dateArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    dateArray = [date];
                }
            } else {
                dateArray = Array.isArray(date) ? date : [date];
            }
        }

        // Handle cover image update
        let coverImage = existingPackage.coverImage;
        if (req.fileLocations && req.fileLocations.length > 0) {
            coverImage = req.fileLocations[0];
        }

        // Build update object
        const updateFields = {
            ...(typeof title !== 'undefined' && { title }),
            ...(typeof about !== 'undefined' && { about }),
            ...(typeof serviceId !== 'undefined' && { serviceId }),
            ...(typeof price !== 'undefined' && { price }),
            ...(typeof duration !== 'undefined' && { duration }),
            ...(typeof discount !== 'undefined' && { discount }),
            subService: subServiceArray,
            date: dateArray,
            coverImage
        };

        const updatedPackage = await Package.findByIdAndUpdate(
            packageId,
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json({
            success: true,
            status: 200,
            message: "Package updated successfully!",
            data: updatedPackage
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};


// get package stylist wise
const getStylistPackages = async (req, res) => {
    try {
        const stylistId = req.user.id;
        const packages = await Package.find({ stylist: stylistId })
            .populate('serviceId', 'name _id')
            .populate('subService', 'name');
        res.status(200).json({
            success: true,
            status: 200,
            message: packages.length === 0 ? "No package found!" : "Package fetched successfully!",
            data: packages
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

// get offer packages
const getCoverPackages = async (req, res) => {
    try {
        const packages = await Package.find({ discount: { $gt: 0 } }).sort({ discount: -1 });

        res.status(200).json({
            success: true,
            status: 200,
            message: packages.length === 0 ? "No packages with offers" : "Packages fetcehd successfully!",
            data: packages
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

module.exports = {
    createPackage,
    getPackage,
    deletePackage,
    updatePackageByStylist,
    getStylistPackages,
    getCoverPackages
}
