import { Link } from "react-router-dom";

const EmptyState = ({ title, description, to = "/products",
  linkLabel = "Xem sản phẩm" }) => (
  <section className="empty-state">
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {to && <Link className="button" to={to}>{linkLabel}</Link>}
  </section>
);

export default EmptyState;
