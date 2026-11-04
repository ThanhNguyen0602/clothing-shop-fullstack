# Web bán quần áo (Full-stack)

Đồ án cuối khóa Full-stack: website thương mại điện tử bán quần áo.

## Công nghệ

- Front-end: React + Vite
- Back-end: Node.js + Express
- Database: MySQL 8.0
- Xác thực: JWT + bcrypt

## Cách chạy

1. Clone repo:
   ```bash
   git clone https://github.com/ThanhNguyen0602/app-project.git
   cd app-project
   ```
2. Cài thư viện:
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```
3. Tạo `backend/.env` và `frontend/.env` từ file `.env.example`, điền thông tin MySQL.
4. Tạo database `clothing_shop_db` trong MySQL.
5. Chạy:
   ```bash
   npm run dev
   ```
   Back-end: http://localhost:3000 | Front-end: http://localhost:5173
