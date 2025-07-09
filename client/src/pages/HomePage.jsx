import styles from "../styles/HomePage.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import image from "../assets/images/Bakery-background.jpg"
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
      <img
        className={styles.heroImg}
        src= {image} 
        alt="Bakery"
        loading="lazy"
      />

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

      {/* Best Sellers Section */}
      <h2 className={styles.bestSellerTitle}>Best Sellers</h2>
      <div className={styles.bestSellerGrid}>
        {bestSellers.map((food) => (
          <FoodItem key={food._id} food={food} />
        ))}
      </div>
    </div>
  );
}

// FoodItem Component (Fixed)
function FoodItem({ food }) {
  const [quantity, setQuantity] = useState(1); // ✅ Added useState for quantity

  const addToCart = (food) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item._id === food._id);

    if (existingItem) {
      existingItem.quantity += quantity; // Increase existing quantity
    } else {
      cart.push({ ...food, quantity }); // Add new item with selected quantity
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${quantity} x ${food.name} added to cart!`);
  };

  return (
    <div className={styles.food}>
      <h3>{food.name}</h3>
      <img src={food.image || "https://placehold.co/150"} alt={food.name} loading="lazy" />
      <p className={styles.desc}>{food.description}</p>
      <b>₹{food.price}</b>

      {/* Quantity Controls */}
      <div className={styles.quantityContainer}>
        <button
          className={styles.quantityButton}
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
        >
          −
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
      <button className={styles.addToCart} onClick={() => addToCart(food)}>
        Add to Cart
      </button>
    </div>
  );
}

export default Homepage;
