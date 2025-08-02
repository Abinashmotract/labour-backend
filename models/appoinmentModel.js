const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appoinmentSchema = Schema({

    userId: {
        type:Schema.Types.ObjectId,
        
    }

});

module.exports = mongoose.model('appoinment', appoinmentSchema);