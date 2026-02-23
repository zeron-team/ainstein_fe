// src/components/layout/Footer.tsx
import { FaHeartbeat, FaGithub } from "react-icons/fa";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span className="footer-brand">
        <FaHeartbeat className="footer-icon" />
        <strong>EPC Builder</strong> by AInstein
      </span>
      <span className="footer-divider">•</span>
      <span className="footer-copy">© {year} ZRN Health</span>
      <span className="footer-divider">•</span>
      <span className="footer-version">v2.0.0</span>
    </footer>
  );
};

export default Footer;