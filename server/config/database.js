const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        maxPoolSize:50,
        wtimeoutMS:2500,
        useNewUrlParser: true
    })
    .then(() => console.log('DB Connected Successfully'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
}