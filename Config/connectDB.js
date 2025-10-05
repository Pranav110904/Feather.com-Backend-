import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()
if(!process.env.MONGO_URI){
    throw new Error('MONGO_URI must be defined')
}


async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected to MongoDB')
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export default connectDB


