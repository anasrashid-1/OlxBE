const mongoose = require('mongoose');

const getDate = () => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0'); 
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
    const year = String(currentDate.getFullYear());
    const formattedDate = `${day}-${month}-${year}`;
    console.log(formattedDate);
    return formattedDate;
}

const PostSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    postedAt : {
        type: Date,
        default: getDate
    },
    price: {
        type: Number,
        required: true,
    },
    user_id : {type : String, required : true}
});

const PostModel = mongoose.model('post', PostSchema);
module.exports = PostModel;