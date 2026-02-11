const mongoose = require("mongoose");
const config = require("../config/config")

const connectToDb = async () => {
    // connect to mongo db
const mongoUri = config.default.mongo.host;
/** Ensure to check the MongoDB URI configuration in PM2 @logs */
console.log("MONGOURI", mongoUri);
    mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true, useUnifiedTopology: true  }).then(async () => {
        const ConfigureModel = require("../models/configureScreens.model").default;
        const configurations = await ConfigureModel.find({ active: true });
        global.configurations = configurations;
        require("../../server");
    })
}

connectToDb();