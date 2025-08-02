const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const subServiceSchema = mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service"
        },
        name: {
            type: String
        }
    }
);

module.exports = mongoose.model('SubService', subServiceSchema); 