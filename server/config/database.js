import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI, { family: 4 });
    console.log("✅ MongoDB Connected...");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
