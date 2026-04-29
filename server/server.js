import connectDB from "./config/database.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
