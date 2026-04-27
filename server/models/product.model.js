import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: { type: [String], required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  description: { type: String },
  images: {
    type: [String],
    validate: {
      validator: (images) => images.length <= 3,
      message: "A product can have up to 3 images",
    },
    default: [],
  },
});

const Product = model("Product", ProductSchema);

export default Product;
