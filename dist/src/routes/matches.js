"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const match_controller_1 = require("../controllers/match.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Match routes
router.post('/', auth_1.authMiddleware, match_controller_1.createMatch);
router.get('/', auth_1.authMiddleware, match_controller_1.getAllMatches);
exports.default = router;
