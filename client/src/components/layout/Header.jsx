import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  faGauge,
  faHouse,
  faList,
  faCartShopping,
  faUser,
  faHistory,
  faUserPlus,
  faSignIn,
  faRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import styles from "../../styles/Header.module.css";
import delishMondeLogo from "../../assets/images/Delish Monde - Logo.png";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src={delishMondeLogo} alt="Delish Monde Logo" />
        </div>

        <h1 className={styles.brandTitle}>Delish Monde</h1>


        <nav
          className={`${styles.navContainer} ${isMenuOpen ? styles.menuOpen : ""}`}
        >
          <ul className={styles.navbar}>
            <li>
              <NavLink to="/">
                <FontAwesomeIcon icon={faHouse} className={styles.iconSpacing} />
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/menu">
                <FontAwesomeIcon icon={faList} className={styles.iconSpacing} />
                Menu
              </NavLink>
            </li>
            {user?.isAdmin && (
              <li>
                <NavLink to="/admin">
                  <FontAwesomeIcon icon={faGauge} className={styles.iconSpacing} />
                  Admin
                </NavLink>
              </li>
            )}
            {user && !user.isAdmin && (
              <>
                <li>
                  <NavLink to="/cart">
                    <span className={styles.cartIconWrapper}>
                      <FontAwesomeIcon
                        icon={faCartShopping}
                        className={styles.iconSpacing}
                      />
                      {cartCount > 0 && (
                        <span className={styles.badge} key={cartCount}>
                          {cartCount}
                        </span>
                      )}
                    </span>
                    Cart
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/order-history">
                    <FontAwesomeIcon
                      icon={faHistory}
                      className={styles.iconSpacing}
                    />
                    Order History
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile">
                    <FontAwesomeIcon icon={faUser} className={styles.iconSpacing} />
                    Profile
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className={styles.mobileAccountActions}>
            {user ? (
              <div className={styles.accountActions}>
                <span className={styles.accountName} title={user.username}>
                  {user.username}
                  {user.email === "demo@delishmonde.test" && (
                    <span className={styles.demoBadge}>DEMO</span>
                  )}
                </span>
                <button type="button" onClick={handleLogout}>
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    className={styles.iconSpacing}
                  />
                  <span className={styles.logoutText}>Logout</span>
                </button>
              </div>
            ) : (
              <div className={styles.authLinks}>
                <NavLink to="/login" state={{ from: location.pathname }}>
                  <FontAwesomeIcon icon={faSignIn} className={styles.iconSpacing} />
                  Login
                </NavLink>
                <span className={styles.divider}>|</span>
                <NavLink to="/register">
                  <FontAwesomeIcon icon={faUserPlus} className={styles.iconSpacing} />
                  Register
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className={styles.desktopAccountActions}>
          {user ? (
            <div className={styles.accountActions}>
              <span className={styles.accountName} title={user.username}>
                {user.username}
                {user.email === "demo@delishmonde.test" && (
                  <span className={styles.demoBadge}>DEMO</span>
                )}
              </span>
              <button type="button" onClick={handleLogout}>
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className={styles.iconSpacing}
                />
                <span className={styles.logoutText}>Logout</span>
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <NavLink to="/login" state={{ from: location.pathname }}>
                <FontAwesomeIcon icon={faSignIn} className={styles.iconSpacing} />
                Login
              </NavLink>
              <span className={styles.divider}>|</span>
              <NavLink to="/register">
                <FontAwesomeIcon icon={faUserPlus} className={styles.iconSpacing} />
                Register
              </NavLink>
            </div>
          )}
        </div>

        <button
          className={styles.menuToggle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
        </button>

        {isMenuOpen && (
          <div
            className={styles.overlay}
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </header>
    </>
  );
}

export default Header;
