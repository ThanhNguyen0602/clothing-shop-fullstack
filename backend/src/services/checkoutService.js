const checkout = require("../models/checkoutModel");

const options = async () => {
  const shipping_methods = await checkout.listShipping();
  const payment_methods = await checkout.listPayments();

  return { shipping_methods, payment_methods };
};

module.exports = { options };
