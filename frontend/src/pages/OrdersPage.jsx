import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Pager from "../components/common/Pager";
import StatusBadge from "../components/common/StatusBadge";
import { Loading, RequestError } from "../components/products/CatalogUI";
import useRequest from "../hooks/useRequest";
import { listMyOrders } from "../services/shopService";
import { dateText, priceText } from "../utils/catalogDisplay";
import { ORDER_STATUS, PAYMENT_STATUS } from "../utils/orderStatus";

const loadOrders = (_id, page, signal) => listMyOrders(page, signal);

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const { data, error, loading, retry } = useRequest(loadOrders, "mine", page);

  return (
    <div className="tv-page">
      <PageHeader title="Đơn hàng của bạn" />
      {loading && <Loading text="Đang tải đơn hàng…" />}
      {error && <RequestError retry={retry} />}
      {data && data.items.length === 0 && page === 1 && (
        <EmptyState title="Bạn chưa có đơn hàng" description="Bắt đầu mua sắm ngay hôm nay." />
      )}
      {data && data.items.length > 0 && (
        <div className="table-responsive">
          <table className="table tv-table align-middle">
            <thead>
              <tr><th>Mã đơn</th><th>Ngày đặt</th><th>Tổng tiền</th>
                <th>Trạng thái</th><th>Thanh toán</th><th aria-label="Thao tác" /></tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.order_code}</strong></td>
                  <td>{dateText(order.created_at)}</td>
                  <td>{priceText(order.total_amount)}</td>
                  <td><StatusBadge status={order.order_status} labels={ORDER_STATUS} /></td>
                  <td><StatusBadge status={order.payment_status} labels={PAYMENT_STATUS} /></td>
                  <td><Link className="btn btn-sm btn-dark" to={`/orders/${order.id}`}>Chi tiết</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={page} hasNext={data.pagination.has_next} onChange={setPage} />}
    </div>
  );
};

export default OrdersPage;
