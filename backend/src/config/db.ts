import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MongoDB connection string is not defined (MONGO_URI or MONGODB_URI)');
    }

    await mongoose.connect(uri);

    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
console.log('ENV URI:', process.env.MONGO_URI || process.env.MONGODB_URI);
