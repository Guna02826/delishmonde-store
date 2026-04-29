import Product from "../models/product.model.js";

const formatImages = (images, image) => {
  if (Array.isArray(images)) {
    return images.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof images === "string") {
    return images
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return image ? [image] : [];
};

export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, limit } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    let query = Product.find(filter);
    
    if (limit) {
      query = query.limit(Number(limit));
    }

    const cakes = await query;
    res.json(cakes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, description, images, image } =
      req.body;

    const newProduct = new Product({
      name,
      category,
      price,
      stock,
      description,
      images: formatImages(images, image),
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      images: formatImages(req.body.images, req.body.image),
    };

    delete updateData.image;

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
