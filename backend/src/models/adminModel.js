const escapeLike = (value) => value.replace(/[!%_]/g, (char) => `!${char}`);

const listUsers = async (db, query) => {
  const conditions = ["1 = 1"];
  const params = [];

  if (query.search) {
    const pattern = `%${escapeLike(query.search)}%`;
    conditions.push("(u.email LIKE ? ESCAPE '!' OR u.full_name LIKE ? ESCAPE '!')");
    params.push(pattern, pattern);
  }

  if (query.role) {
    conditions.push("r.name = ?");
    params.push(query.role);
  }

  if (query.status) {
    conditions.push("u.status = ?");
    params.push(query.status);
  }

  const [rows] = await db.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.status, r.name AS role, u.created_at
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE ${conditions.join(" AND ")} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...params, String(query.limit + 1), String((query.page - 1) * query.limit)]);

  return { items: rows.slice(0, query.limit),
    pagination: { page: query.page, limit: query.limit, has_next: rows.length > query.limit } };
};

const lockUser = async (db, id) => {
  const [rows] = await db.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.status, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ? FOR UPDATE`, [id]);

  return rows[0];
};

const roleId = async (db, name) => {
  const [rows] = await db.execute("SELECT id FROM roles WHERE name = ?", [name]);

  if (!rows[0]) throw new Error(`Missing ${name} role`);

  return rows[0].id;
};

const setRole = async (db, id, role) => {
  await db.execute("UPDATE users SET role_id = ? WHERE id = ?", [await roleId(db, role), id]);
};

const setStatus = async (db, id, status) => {
  await db.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);
};

const insertUser = async (db, data, hash) => {
  const [result] = await db.execute(
    `INSERT INTO users (role_id, full_name, email, phone, password_hash, status)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
    [await roleId(db, data.role), data.full_name, data.email, data.phone, hash]);

  return result.insertId;
};

const audit = async (db, actor, action, entity, id, oldValues, newValues) => {
  await db.execute(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values,
       new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [actor.id, action, entity, id, oldValues === null ? null : JSON.stringify(oldValues),
      newValues === null ? null : JSON.stringify(newValues), actor.ip ?? null]);
};

const listSettings = async (db) => {
  const [rows] = await db.execute("SELECT setting_key, setting_value FROM system_settings");

  return rows;
};

const upsertSetting = async (db, key, value) => {
  await db.execute(
    `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = ?`, [key, value, value]);
};

module.exports = { listUsers, lockUser, setRole, setStatus, insertUser, audit,
  listSettings, upsertSetting };
