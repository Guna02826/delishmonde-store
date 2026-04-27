import styles from "../styles/HomePage.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import image from "../assets/images/Bakery-background.jpg";
import { addCartItem } from "../api/cartApi";

const API_URL = import.meta.env.VITE_API_URL;

function Homepage() {
  const [bestSellers, setBestSellers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_URL}/products/`)
      .then((response) => {
        const bestSellerItems = response.data.filter((item) =>
          item.category.includes("Best Sellers")
        );
        setBestSellers(bestSellerItems);
      })
      .catch((error) => {
        console.error("Error fetching Best Sellers:", error);
      });
  }, []);

  return (
    <div className={styles.hero}>
      <img className={styles.heroImg} src={image} alt="Bakery" loading="lazy" />

      <h1 className={styles.heroTitle}>
        Freshly Baked, From Our Oven to Your Table
      </h1>

      <p className={styles.heroDescription}>
        Our menu is made with the freshest ingredients, locally sourced and
        organic whenever possible. We offer a variety of options for every
        dietary need, including vegetarian, vegan, and gluten-free. Our menu
        changes seasonally, so check back often for new items!
      </p>

      <button className={styles.heroButton} onClick={() => navigate("/menu")}>
        Order Now
      </button>

      <h2 className={styles.bestSellerTitle}>Best Sellers</h2>
      <div className={styles.bestSellerGrid}>
        {bestSellers.map((food) => (
          <FoodItem key={food._id} food={food} />
        ))}
      </div>
    </div>
  );
}

function FoodItem({ food }) {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const productImage = food.images?.[0] || food.image || "https://placehold.co/150";

  const addToCart = async () => {
    try {
      await addCartItem(food._id, quantity);
      alert(`${quantity} x ${food.name} added to cart!`);
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Please log in to add items to your cart.");
        navigate("/login");
        return;
      }

      alert(error.response?.data?.message || "Failed to add item to cart.");
    }
  };

  return (
    <div className={styles.food}>
      <img
        src={productImage}
        alt={food.name}
        loading="lazy"
      />
      <h3>{food.name}</h3>
      <p className={styles.desc}>{food.description}</p>
      <b>₹{food.price}</b>

      <div className={styles.quantityContainer}>
        <button
          className={styles.quantityButton}
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
        >
          -
        </button>
        <span className={styles.quantity}>{quantity}</span>
        <button
          className={styles.quantityButton}
          onClick={() => setQuantity((prev) => prev + 1)}
        >
          +
        </button>
      </div>
      <br />
      <button className={styles.addToCart} onClick={addToCart}>
        Add to Cart
      </button>
    </div>
  );
}

export default Homepage;
