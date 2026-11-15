import { statusTone } from "../../utils/orderStatus";

const StatusBadge = ({ status, labels = {} }) => (
  <span className={`status-badge status-badge--${statusTone(status)}`}>
    {labels[status] ?? status}
  </span>
);

export default StatusBadge;
