const brands = require("../models/brandModel");

const listPublic = () => brands.listPublic();

module.exports = { listPublic };
