"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const models_1 = require("../models");
(0, globals_1.describe)('Auth Routes', () => {
    (0, globals_1.beforeEach)(async () => {
        await models_1.User.destroy({ where: {} });
    });
    (0, globals_1.describe)('POST /api/auth/register', () => {
        (0, globals_1.it)('should register a new user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                teamNumber: 1234,
            });
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toHaveProperty('token');
            (0, globals_1.expect)(response.body.user).toHaveProperty('id');
        });
    });
    (0, globals_1.describe)('POST /api/auth/login', () => {
        (0, globals_1.it)('should login an existing user', async () => {
            await models_1.User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                teamNumber: 1234,
            });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('token');
        });
    });
});
