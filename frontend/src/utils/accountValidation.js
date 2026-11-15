const validEmail = (value) => value.length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validPhone = (value) => /^\+?[0-9]{10,15}$/.test(value);

const validPassword = (value) => value.length >= 8 &&
  new TextEncoder().encode(value).length <= 72;

const validateProfile = ({ full_name, phone }, phoneRequired = false) => {
  if (!full_name || full_name.length > 100) {
    return "Họ tên cần từ 1 đến 100 ký tự.";
  }
  if ((phoneRequired || phone) && !validPhone(phone)) {
    return "Điện thoại cần 10 đến 15 chữ số và có thể bắt đầu bằng +.";
  }

  return "";
};

export { validEmail, validPassword, validateProfile };
