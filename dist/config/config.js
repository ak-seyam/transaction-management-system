"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    database: {
        host: process.env['DB_HOST'],
        port: process.env['DB_PORT'],
        username: process.env['DB_USERNAME'],
        password: process.env['DB_PASSWORD'],
        database: process.env['DB_NAME'],
        type: 'postgres',
    },
});
//# sourceMappingURL=config.js.map