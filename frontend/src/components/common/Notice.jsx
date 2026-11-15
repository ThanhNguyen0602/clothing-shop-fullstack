// Thong bao thanh cong / loi dung chung cho cac form.
const Notice = ({ error, message }) => (
  <>
    {error && <p className="tv-alert tv-alert--danger" role="alert">{error}</p>}
    {message && <p className="tv-alert tv-alert--success" role="status">{message}</p>}
  </>
);

export default Notice;
