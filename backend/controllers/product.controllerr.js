import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
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
export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featuredProducts");
		if (featuredProducts) {
			featuredProducts = JSON.parse(featuredProducts);
			return res.status(200).json({ featuredProducts, source: "cache" });
		}
		// if not in redis, fetch from database
		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts || featuredProducts.length === 0) {
			return res.status(404).json({ message: "No featured products found" });
		}
		// store in redis for future requests
		await redis.set("featuredProducts", JSON.stringify(featuredProducts));
		return res.status(200).json({ featuredProducts, source: "db" });
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{ $sample: { size: 3 } },
			{$project: { id: 1, name: 1, description: 1, price: 1, image: 1, category: 1 } }
		
		]);
		res.status(200).json({ products });
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.status(200).json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}; 
export const toggleFeaturedProduct = async (req, res) => {
	const { id } = req.params;
	try {
		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		product.isFeatured = !product.isFeatured;
		const updatedProduct = await product.save();
		await updateFeaturedProductsCache();
		return res.status(200).json({ message: "Product featured status updated successfully", product: updatedProduct });
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featuredProducts", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("Error updating featured products cache", error.message);
	}
}
	
