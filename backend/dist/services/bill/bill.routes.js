"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const bill_controller_js_1 = require("./bill.controller.js");
exports.billRouter = (0, express_1.Router)();
const controller = new bill_controller_js_1.BillController();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only images are allowed'));
        }
    }
});
// Routes
exports.billRouter.get('/', controller.getBills);
exports.billRouter.get('/:id', controller.getBill);
exports.billRouter.post('/upload', upload.single('image'), controller.uploadBill);
exports.billRouter.put('/:id', controller.updateBill);
exports.billRouter.delete('/:id', controller.deleteBill);
exports.billRouter.post('/:id/reprocess', controller.reprocessBill);
exports.billRouter.post('/:id/create-transaction', controller.createTransactionFromBill);
//# sourceMappingURL=bill.routes.js.map