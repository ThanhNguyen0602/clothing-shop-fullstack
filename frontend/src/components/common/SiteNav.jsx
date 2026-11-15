import { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import { listCategories } from "../../services/catalogService";

// Thanh menu den cua TV Studio; danh muc lay tu API /categories.
const SiteNav = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal)
      .then((items) => setCategories(items.slice(0, 4)))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <Navbar expand="lg" collapseOnSelect data-bs-theme="dark" className="site-navbar">
      <Container fluid className="nav-inner">
        <Navbar.Brand as={Link} to="/" className="nav-brand" aria-label="Trang chủ">
          <svg className="nav-brand-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M16 3 21 6 19 11 16 9V21H8V9L5 11 3 6 8 3a4 4 0 0 0 8 0Z" />
          </svg>
          <small>EST. 2026</small>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-shop-nav" aria-label="Mở menu" />
        <Navbar.Collapse id="main-shop-nav">
          <Nav className="nav-menu mx-lg-auto">
            <Nav.Link as={NavLink} to="/" end>Trang chủ</Nav.Link>
            <Nav.Link as={NavLink} to="/products" end>Sản phẩm</Nav.Link>
            {categories.map((category) => (
              <Nav.Link key={category.id} as={Link}
                to={`/products?category=${category.id}`}>{category.name}</Nav.Link>
            ))}
          </Nav>
          <Nav className="nav-action">
            <Nav.Link as={Link} to="/products?onSale=1" className="nav-sale">
              SALE <span>↗</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default SiteNav;
