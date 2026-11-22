// Kiem tra Buoi 11 cua Hieu: node --test tests/buoi11-hieu.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { getReviewOverview } from "../src/utils/reviewRating.js";

const here = dirname(fileURLToPath(import.meta.url));

// Thuc thi rieng logic destination co SAN trong AuthGuards, khong sua code do.
const source = readFileSync(resolve(here, "../src/routes/AuthGuards.jsx"), "utf8");
const start = source.indexOf("const customerPaths = ");
const end = source.indexOf("const RequireAuth = ", start);
assert.ok(start >= 0 && end > start, "Khong tim thay ham dieu huong goc");
const destination = runInNewContext(
  `${source.slice(start, end)}\ndestination;`,
  { validProductId: (id) => /^[1-9]\d*$/.test(String(id)) }
);

test("Diem trung binh duoc lay tu summary cua API", () => {
  assert.deepEqual(getReviewOverview({ count: 12, average: 4.5 }),
    { count: 12, average: 4.5, percentage: 90 });
});

test("Gia tri string tu MySQL van duoc xu ly dung", () => {
  assert.deepEqual(getReviewOverview({ count: "7", average: "4.25" }),
    { count: 7, average: 4.25, percentage: 85 });
});

test("Khong co review khong hien diem sao gia", () => {
  assert.deepEqual(getReviewOverview({ count: 0, average: 5 }),
    { count: 0, average: 0, percentage: 0 });
});

test("Gia tri bat thuong khong vuot qua 5 sao", () => {
  assert.equal(getReviewOverview({ count: 10, average: 99 }).average, 5);
  assert.equal(getReviewOverview({ count: 10, average: -10 }).average, 0);
  assert.equal(getReviewOverview({ count: "x", average: "x" }).count, 0);
});

test("ADMIN dang nhap thi dieu huong /admin", () => {
  assert.equal(destination("ADMIN", null), "/admin");
});

test("MANAGER dang nhap thi dieu huong /manager", () => {
  assert.equal(destination("MANAGER", null), "/manager");
});

test("CUSTOMER dang nhap tu trang login thi ve /", () => {
  assert.equal(destination("CUSTOMER", null), "/");
});

test("CUSTOMER tro lai trang hop le da yeu cau truoc khi login", () => {
  assert.equal(destination("CUSTOMER", "/cart"), "/cart");
  assert.equal(destination("CUSTOMER", "/orders/123"), "/orders/123");
  assert.equal(destination("CUSTOMER", "/products/10"), "/products/10");
});

test("Khong redirect CUSTOMER den URL ngoai hoac trang Admin", () => {
  assert.equal(destination("CUSTOMER", "//example.com"), "/");
  assert.equal(destination("CUSTOMER", "/admin"), "/");
});
