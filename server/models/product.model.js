import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: { type: [String], required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  description: { type: String },
  image: { type: String },
});

const Product = model("Product", ProductSchema);

export default Product;