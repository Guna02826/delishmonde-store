import { z } from "zod";

export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must include at least one special character")
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(2, "Category is required"),
  price: z.number().positive("Price must be a positive number"),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  description: z.string().optional(),
  images: z.union([z.string(), z.array(z.string())]).optional(),
  image: z.string().optional()
});

export const updateProductSchema = createProductSchema.partial();
