import styles from "../styles/HomePage.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import image from "../assets/images/Bakery-background.jpg";
import FoodItem from "../components/FoodItem";

const API_URL = import.meta.env.VITE_API_URL;

function Homepage() {
  const [bestSellers, setBestSellers] = useState([]);
  const [startingDemo, setStartingDemo] = useState(false);
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

  const startDemo = async () => {
    setStartingDemo(true);

    try {
      const response = await axios.post(
        `${API_URL}/users/demo-session`,
        {},
        { withCredentials: true }
      );

      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/menu");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to start demo session.");
    } finally {
      setStartingDemo(false);
    }
  };

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

      <div className={styles.heroActions}>
        <button className={styles.heroButton} onClick={() => navigate("/menu")}>
          Order Now
        </button>
        <button
          className={`${styles.demoButton} ${styles.pulse}`}
          onClick={startDemo}
          disabled={startingDemo}
          title="Instant access as a guest - No login required"
        >
          {startingDemo ? "Starting Demo..." : "Interactive Demo"}
        </button>
      </div>

      <h2 className={styles.bestSellerTitle}>Best Sellers</h2>
      <div className={styles.bestSellerGrid}>
        {bestSellers.map((food) => (
          <FoodItem
            key={food._id}
            food={food}
            variant="home"
            successMode="alert"
          />
        ))}
      </div>
    </div>
  );
}

export default Homepage;
