import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faList,
  faCartShopping,
  faUser,
  faHistory,
  faUserPlus,
  faSignIn,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../styles/Header.module.css";
import delishMondeLogo from "../../assets/images/Delish Monde - Logo.png"
function Header() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src={delishMondeLogo} alt="Delish Monde Logo" />
        </div>

        <div className={styles.navContainer}>
          <h1>Delish Monde</h1>
          <nav>
            <ul className={styles.navbar}>
              <li>
                <a href="/">
                  <FontAwesomeIcon icon={faHouse} className={styles.iconSpacing} />
                  Home
                </a>
              </li>
              <li>
                <a href="/menu">
                  <FontAwesomeIcon icon={faList} className={styles.iconSpacing} />
                  Menu
                </a>
              </li>
              <li>
                <a href="/cart">
                  <FontAwesomeIcon icon={faCartShopping} className={styles.iconSpacing} />
                  Cart
                </a>
              </li>
              <li>
                <a href="/order-history">
                  <FontAwesomeIcon icon={faHistory} className={styles.iconSpacing} />
                  Order History
                </a>
              </li>
              <li>
                <a href="/profile">
                  <FontAwesomeIcon icon={faUser} className={styles.iconSpacing} />
                  Profile
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className={styles.loginSignup}>
          <a href="/login">
            <FontAwesomeIcon icon={faSignIn} className={styles.iconSpacing} />
            Login
          </a>
          <span>|</span>
          <a href="/register">
            <FontAwesomeIcon icon={faUserPlus} className={styles.iconSpacing} />
            Register
          </a>
        </div>
      </header>
    </>
  );
}

export default Header;
