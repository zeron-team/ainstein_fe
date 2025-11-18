import { FaHeartbeat } from "react-icons/fa";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span>
        <span>
           Ainstein &amp; IA — {year} · powered by ZRN <FaHeartbeat style={{ marginRight: 8, verticalAlign: "middle" }} />Health
        </span>
      </span>
    </footer>
  );
};

export default Footer;