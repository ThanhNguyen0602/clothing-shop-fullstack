import { NavLink } from "react-router-dom";

const Sidebar = ({ title, items }) => (
  <aside className="sidebar">
    <h2>{title}</h2>
    <nav aria-label={title}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end ?? false}
          className={({ isActive }) => isActive ? "is-active" : ""}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
