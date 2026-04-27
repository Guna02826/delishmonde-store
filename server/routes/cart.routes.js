import { Router } from "express";

import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { verifyUser } from "../middleware/auth.middleware.js";

const router = Router();

const populateCart = (query) =>
  query.populate("items.productId", "name price images description category stock");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

router.use(verifyUser);

router.get("/", async (req, res) => {
  try {
    const cart = await populateCart(Cart.findOne({ userId: req.user.id }));

    res.json(cart || { userId: req.user.id, items: [] });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

router.post("/items", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const itemQuantity = Number(quantity);

    if (!productId || !Number.isInteger(itemQuantity) || itemQuantity < 1) {
      return res.status(400).json({ message: "Invalid cart item" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += itemQuantity;
    } else {
      cart.items.push({ productId, quantity: itemQuantity });
    }

    await cart.save();

    const updatedCart = await populateCart(Cart.findById(cart._id));
    res.status(201).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

router.put("/items/:productId", async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(
      (cartItem) => cartItem.productId.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await populateCart(Cart.findById(cart._id));
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Failed to update cart item" });
  }
});

router.delete("/items/:productId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== req.params.productId
    );
    await cart.save();

    const updatedCart = await populateCart(Cart.findById(cart._id));
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

export default router;
