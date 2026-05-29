"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDatabase = void 0;
const sync_service_1 = require("../services/sync.service");
const syncDatabase = async (req, res) => {
    try {
        const result = await (0, sync_service_1.syncToMysql)();
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error during sync', error: error.message });
    }
};
exports.syncDatabase = syncDatabase;
