"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const index_js_1 = require("../config/index.js");
exports.pool = new pg_1.Pool({
    connectionString: index_js_1.config.database.url,
});
// Test connection
exports.pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL');
});
exports.pool.on('error', (err) => {
    console.error('PostgreSQL error:', err);
});
const query = async (text, params) => {
    const start = Date.now();
    const result = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
};
exports.query = query;
//# sourceMappingURL=db.js.map