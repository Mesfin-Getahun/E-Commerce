import User from "../models/user.model.js";

export const getCartProducts = async (req, res) => {
    try {
        const user = await product.find({_id:{$in: req.user.cartItems}});

        //add quantity to each product
        const cartItems = user.cartItems.map(product => {
            const Item = req.user.cartItems.find(cartItem =>cartItem.id === product.id);
            return { ...product._doc.toJSON(), quantity: Item.quantity };
        });
        res.json({ cartItems });
    } catch (error) {
        console.error("Error in getCartProducts controller", error.message);
        res.status(500).json({ message: "Error fetching cart products" });
    }
};

export const addToCart = async (req, res) => {  
    try {
        const {productID} = req.body;
        const user = req.user;

        const existingItem = user.cart.find(item => item.product.toString() === productID);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cart.push({ product: productID, quantity: 1 });
        }
        await user.save();
        res.json({ message: "Product added to cart successfully", cart: user.cart });
    } catch (error) {
        console.error("Error in addToCart controller", error.message);
        res.status(500).json({ message: "Error adding product to cart" });
    }

};
export const removeAllFromCart = async (req, res) => {
    const { productID } = req.body; 
    const user = req.user;
    try {
        if (!productID) {
            user.cartItems = [];
        } else {
            user.cartItems = user.cartItems.filter((item) => item.id !== productID);
        }
        await user.save();
        res.json({ message: "All products removed from cart successfully", cart: user.cartItems });
    } catch (error) {
        console.error("Error in removeAllFromCart controller", error.message);
        res.status(500).json({ message: "Error removing products from cart" });
    }
};
export const updateQuantity = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    try {
        const existingItem = user.cartItems.find(item => item.id === id);

        if (!existingItem) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        if (quantity === 0) {
            user.cartItems = user.cartItems.filter(item => item.id !== id);
            await user.save();
            return res.json({ message: "Product removed from cart", cart: user.cartItems });
        }

        existingItem.quantity = quantity;
        await user.save();
        res.json({ message: "Product quantity updated successfully", cart: user.cartItems });
    } catch (error) {
        console.error("Error in updateQuantity controller", error.message);
        res.status(500).json({ message: "Error updating product quantity" });
    }
};
