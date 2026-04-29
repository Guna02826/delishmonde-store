import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { addCartItem } from "../api/cartApi";
import styles from "../styles/FoodItem.module.css";
import { useCart } from "../context/CartContext";

function FoodItem({ food, variant = "menu", successMode = "inline" }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  const productImage = food.images?.[0] || food.image || "https://placehold.co/150";
  const hasStockLimit = Number.isInteger(food.stock);

  const addToCart = async () => {
    try {
      await addCartItem(food._id, quantity);

      toast.success(`${quantity} x ${food.name} added to cart!`);
      refreshCartCount();

      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please log in to add items to your cart.");
        navigate("/login");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to add item to cart.");
    }
  };

  return (
    <div className={styles.food}>
      <img
        className={variant === "home" ? styles.homeImage : styles.menuImage}
        src={productImage}
        alt={food.name || "Food item"}
        loading="lazy"
      />
      <h3>{food.name}</h3>
      <p className={styles.desc}>{food.description}</p>
      <b>Rs. {food.price}</b>

      <div className={styles.quantityContainer}>
        <button
          className={styles.quantityButton}
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          disabled={quantity <= 1}
          type="button"
        >
          -
        </button>
        <span className={styles.quantity}>{quantity}</span>
        <button
          className={styles.quantityButton}
          onClick={() => setQuantity((prev) => prev + 1)}
          disabled={hasStockLimit && quantity >= food.stock}
          type="button"
        >
          +
        </button>
      </div>

      {hasStockLimit && quantity >= food.stock && (
        <p className={styles.stockLimit}>Stock limit reached</p>
      )}

      <button className={styles.addToCart} onClick={addToCart} type="button">
        {added ? "Added" : "Add to Cart"}
      </button>
    </div>
  );
}

export default FoodItem;
