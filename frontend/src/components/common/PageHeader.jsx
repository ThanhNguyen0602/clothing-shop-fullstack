const PageHeader = ({ title, description, children }) => (
  <header className="page-header">
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {children && <div className="page-header__actions">{children}</div>}
  </header>
);

export default PageHeader;
