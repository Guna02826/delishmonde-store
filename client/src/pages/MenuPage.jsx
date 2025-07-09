import styles from "../styles/MenuPage.module.css";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function MenuPage() {
  const [foods, setFoods] = useState([]);
  const [categorizedFoods, setCategorizedFoods] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        const foodsData = response.data;
        setFoods(foodsData);
        setCategorizedFoods(categorizeFoods(foodsData));
      } catch (err) {
        setError("Failed to load menu. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, []);

  if (loading) return <p className={styles.loading}>Loading menu...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.menuContainer}>
      {Object.keys(categorizedFoods).map((category) => (
        <div key={category} className={styles.categorySection}>
          <h2 className={styles.categoryTitle}>{category}</h2>
          <div className={styles.menu}>
            {categorizedFoods[category].map((food) => (
              <FoodItem key={food._id || food.name} food={food} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// moved outside useEffect for better scope
const categorizeFoods = (foods) => {
  const categories = {};
  foods.forEach((food) => {
    if (Array.isArray(food.category)) {
      food.category
        .filter((cat) => cat !== "Best Sellers")
        .forEach((cat) => {
          if (!categories[cat]) {
            categories[cat] = [];
          }
          categories[cat].push(food);
        });
    }
  });
  return categories;
};

function FoodItem({ food }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addToCart = (food) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item._id === food._id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...food, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={styles.food}>
      <h3>{food.name}</h3>
      <img
        src={food.image || "https://placehold.co/150"}
        alt={food.name || "Food item"}
      />
      <p className={styles.desc}>{food.description}</p>
      <b>₹{food.price}</b>
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
      <button className={styles.addToCart} onClick={() => addToCart(food)}>
        {added ? "Added ✅" : "Add to Cart"}
      </button>
    </div>
  );
}

export default MenuPage;
