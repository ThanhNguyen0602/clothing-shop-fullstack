import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading, RequestError } from "../../components/products/CatalogUI";
import useRequest from "../../hooks/useRequest";
import { getDashboard } from "../../services/managementService";
import { priceText } from "../../utils/catalogDisplay";
import { ORDER_STATUS } from "../../utils/orderStatus";

const loadDashboard = (_id, _page, signal) => getDashboard(signal);

const DashboardPage = () => {
  const { data, error, loading, retry } = useRequest(loadDashboard, "stats");

  if (loading) return <Loading text="Đang tải số liệu…" />;
  if (error) return <RequestError retry={retry} />;

  const cards = [
    ["Tổng đơn hàng", data.total_orders, "/manager/orders"],
    ["Doanh thu (đơn hoàn thành)", priceText(data.revenue), "/manager/orders?status=COMPLETED"],
    ["Sản phẩm đang bán", data.total_products, "/manager/products"],
    [`Sắp hết hàng (≤ ${data.low_stock_threshold})`, data.low_stock, "/manager/products"],
    ["Khách hàng", data.total_customers, null]
  ];

  return (
    <div>
      <PageHeader title="Tổng quan cửa hàng"
        description="Số liệu đọc trực tiếp từ MySQL; doanh thu chỉ tính đơn COMPLETED." />
      <div className="stat-grid">
        {cards.map(([label, value, to]) => (
          <div key={label} className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
            {to && <Link to={to}>Xem</Link>}
          </div>
        ))}
      </div>
      <div className="workspace-columns">
        <section className="tv-panel">
          <h2>Đơn theo trạng thái</h2>
          <table className="table tv-table">
            <tbody>
              {data.statuses.map((row) => (
                <tr key={row.order_status}>
                  <td><StatusBadge status={row.order_status} labels={ORDER_STATUS} /></td>
                  <td className="text-end"><strong>{row.total}</strong></td>
                </tr>
              ))}
              {data.statuses.length === 0 && <tr><td>Chưa có đơn hàng.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="tv-panel">
          <h2>Bán chạy (đơn hoàn thành)</h2>
          <table className="table tv-table">
            <tbody>
              {data.top_products.map((row) => (
                <tr key={row.product_id}>
                  <td>{row.product_name}</td>
                  <td className="text-end"><strong>{row.sold}</strong> sp</td>
                </tr>
              ))}
              {data.top_products.length === 0 && <tr><td>Chưa có dữ liệu.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="tv-panel">
          <h2>Sắp hết hàng</h2>
          <table className="table tv-table">
            <tbody>
              {data.low_stock_items.map((row) => (
                <tr key={row.id}>
                  <td><Link to={`/manager/products/${row.id}/assets`}>{row.name}</Link>
                    <small className="d-block text-muted">{row.sku}</small></td>
                  <td className="text-end"><strong>{row.stock_quantity}</strong></td>
                </tr>
              ))}
              {data.low_stock_items.length === 0 && <tr><td>Tồn kho ổn định.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
