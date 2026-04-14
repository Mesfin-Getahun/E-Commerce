import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
export const createProduct = async (req, res) => {
	const { name, description, price, image, category, stock } = req.body;
	try {
		if (!name || !description || !price || !image || !category) {
			return res.status(400).json({ message: "All fields are required" });
		}
		const uploadedeResult = await cloudinary.uploader.upload(image);
		const imageUrl = uploadedeResult.secure_url;
		const newProduct = new Product({
			name,
			description,
			price,
			image: imageUrl,
			category,
			stock: stock || 0,
		});
		await newProduct.save();

		res.status(201).json({ message: "Product created successfully", product: newProduct });
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find();
		res.status(200).json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
export const getProductById = async (req, res) => {
	const { id } = req.params;
	try {
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.status(200).json({ product });
	} catch (error) {
		console.log("Error in getProductById controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
export const updateProduct = async (req, res) => {
	const { id } = req.params;
	const { name, description, price, image, category, stock } = req.body;
	try {
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		if (name) product.name = name;
		if (description) product.description = description;
		if (price) product.price = price;
		if (image) {
			const uploadResult = await cloudinary.uploader.upload(image);
			product.image = uploadResult.secure_url;
		}
		if (category) product.category = category;
		if (stock !== undefined) product.stock = stock;

		await product.save();
		res.status(200).json({ message: "Product updated successfully", product });
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
export const deleteProduct = async (req, res) => {
	const { id } = req.params;
	try {
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		await Product.findByIdAndDelete(id);
		res.status(200).json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
