import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import styles from "../../styles/Footer.module.css";

function Footer() {
  return (
    <div className={styles.footer}>
      <div className={styles.socialIcons}>
        <a
          href="https://www.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faFacebook} />
        </a>
        <a
          href="https://www.instagram.com/the_delish_monde/?utm_source=ig_web_button_share_sheet"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faInstagram} />
        </a>
      </div>

      <p className={styles.footerText}>
        &copy; {new Date().getFullYear()} Delish Monde. All Rights Reserved.
      </p>
    </div>
  );
}

export default Footer;
