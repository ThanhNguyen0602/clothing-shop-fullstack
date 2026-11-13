// Chay MOT LAN tai thu muc goc du an:  node setup-scripts.js
// Tu them cac scripts cua buoi 1, 3, 4 vao package.json (khong xoa gi co san)
// va bao cac thu vien con thieu. Co the xoa file nay sau khi chay.
const fs = require("fs");
const path = require("path");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const writeJson = (file, data) => {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

const patch = (label, relative, scripts, deps, devDeps) => {
  const file = path.join(__dirname, relative);

  if (!fs.existsSync(file)) {
    console.log(`THIEU ${relative}: tao bang npm init -y (xem buoi 1)`);
    return;
  }

  const pkg = readJson(file);
  pkg.scripts = { ...(pkg.scripts || {}), ...scripts };
  writeJson(file, pkg);
  console.log(`OK    ${relative}: da cap nhat scripts (${label})`);

  if (pkg.type === "module" && label !== "frontend") {
    console.log(`CANH BAO ${relative} co "type": "module", hay xoa dong nay`);
  }

  const have = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const dir = path.dirname(relative);
  const cd = dir === "." ? "" : `cd ${dir} && `;
  const missingDeps = deps.filter((name) => !have[name]);
  const missingDev = devDeps.filter((name) => !have[name]);

  if (missingDeps.length) {
    console.log(`THIEU thu vien o ${relative}: ${missingDeps.join(" ")}`);
    console.log(`  -> ${cd}npm install ${missingDeps.join(" ")}`);
  }

  if (missingDev.length) {
    console.log(`THIEU thu vien dev o ${relative}: ${missingDev.join(" ")}`);
    console.log(`  -> ${cd}npm install -D ${missingDev.join(" ")}`);
  }
};

patch("backend", "backend/package.json", {
  start: "node src/server.js",
  dev: "nodemon src/server.js",
  seed: "node src/seeders/seed.js",
  "verify:seed": "node src/seeders/verifySeed.js",
  "seed:catalog": "node src/seeders/catalogSeeder.js",
  "seed:search": "node src/seeders/searchSeeder.js"
}, ["express", "mysql2", "dotenv", "cors", "bcrypt", "jsonwebtoken"],
["nodemon"]);

patch("root", "package.json", {
  dev: 'concurrently "npm run dev --prefix backend" "npm run dev --prefix frontend"',
  "dev:backend": "npm run dev --prefix backend",
  "dev:frontend": "npm run dev --prefix frontend"
}, [], ["concurrently"]);

patch("frontend", "frontend/package.json", {}, ["axios", "react-router-dom"], []);
