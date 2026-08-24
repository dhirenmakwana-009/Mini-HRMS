import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mini-hrms";

const connectDb = async () => {
  await mongoose.connect(mongoUri);
  console.log("Database connected successfully");
};

export default connectDb;