import styles from "../styles/MenuPage.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { addCartItem } from "../api/cartApi";

const API_URL = import.meta.env.VITE_API_URL;

function MenuPage() {
  const [foods, setFoods] = useState([]);
  const [categorizedFoods, setCategorizedFoods] = useState({});
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(64);

  // Dynamically track header height so sticky filters never overlap on mobile/tablet
  useEffect(() => {
    const headerEl = document.querySelector('header');
    if (!headerEl) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setHeaderHeight(entry.target.offsetHeight);
      }
    });

    observer.observe(headerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: {
            search: filters.search || undefined,
            category: filters.category || undefined,
            minPrice: filters.minPrice || undefined,
            maxPrice: filters.maxPrice || undefined,
          },
        });
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
  }, [filters]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        setCategories(getCategories(response.data));
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  if (loading) return <p className={styles.loading}>Loading menu...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.menuContainer}>
      <div 
        className={styles.filters} 
        style={{ top: `${headerHeight}px` }}
      >
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search products"
        />
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="minPrice"
          min="0"
          value={filters.minPrice}
          onChange={handleFilterChange}
          placeholder="Min price"
        />
        <input
          type="number"
          name="maxPrice"
          min="0"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          placeholder="Max price"
        />
        <button onClick={clearFilters}>Clear</button>
      </div>

      {foods.length === 0 ? (
        <p className={styles.empty}>No products found.</p>
      ) : (
        Object.keys(categorizedFoods).map((category) => (
          <div key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>{category}</h2>
            <div className={styles.menu}>
              {categorizedFoods[category].map((food) => (
                <FoodItem key={food._id || food.name} food={food} />
              ))}
            </div>
          </div>
        ))
      )}
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

const getCategories = (foods) => {
  const categories = new Set();

  foods.forEach((food) => {
    if (Array.isArray(food.category)) {
      food.category.forEach((cat) => {
        if (cat !== "Best Sellers") {
          categories.add(cat);
        }
      });
    }
  });

  return Array.from(categories).sort();
};

function FoodItem({ food }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const productImage = food.images?.[0] || food.image || "https://placehold.co/150";

  const addToCart = async () => {
    try {
      await addCartItem(food._id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
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
        alt={food.name || "Food item"}
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
      <button className={styles.addToCart} onClick={addToCart}>
        {added ? "Added ✅" : "Add to Cart"}
      </button>
    </div>
  );
}

export default MenuPage;
