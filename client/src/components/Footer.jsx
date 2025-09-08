import "./componentsUI/components.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} SellerTools. All Rights Reserved.</p>
      <div className="footer-links">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
    </footer>
  );
};

export default Footer;
