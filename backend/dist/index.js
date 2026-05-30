"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static files
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Routes
app.use('/api', routes_1.default);
// Base route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Sistem Pengolahan Nilai Ujian Madrasah (MI) Grade 6 API',
        status: 'healthy',
    });
});
// 404 Route handler
app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
// Error handling middleware
app.use(error_middleware_1.errorHandler);
// Start Server
app.listen(env_1.env.PORT, () => {
    console.log(`🚀 Server is running in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
    console.log(`👉 Base URL: http://localhost:${env_1.env.PORT}`);
    console.log('TKA Batch route should be loaded now');
});
