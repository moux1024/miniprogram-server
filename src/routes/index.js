const express = require('express');
const router = express.Router();

// 引入控制器
const functionController = require('../controllers/functionController');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const wechatController = require('../controllers/wechatController');
const adminController = require('../controllers/adminController');
const uploadController = require('../controllers/uploadController');

// 引入中间件
const { adminAuth } = require('../middleware/auth');

// 小程序API
router.get('/functions', functionController.getFunctions);
router.get('/functions/:id', functionController.getFunctionById);

router.post('/users', userController.createOrUpdateUser);
router.get('/orders/my', orderController.getMyOrders);
router.post('/orders', orderController.createOrder);

router.post('/wechat/code2session', wechatController.code2session);

// 后台管理API
router.post('/admin/login', adminController.adminLogin);

// 需要认证的管理接口
router.get('/admin/functions', adminAuth, adminController.getAllFunctions);
router.post('/admin/functions', adminAuth, adminController.createFunction);
router.put('/admin/functions/:id', adminAuth, adminController.updateFunction);
router.delete('/admin/functions/:id', adminAuth, adminController.deleteFunction);

router.get('/admin/orders', adminAuth, adminController.getOrders);
router.put('/admin/orders/:id/status', adminAuth, adminController.updateOrderStatus);

router.get('/admin/config', adminAuth, adminController.getConfig);
router.put('/admin/config', adminAuth, adminController.updateConfig);

// 文件上传接口
router.post('/upload/single', uploadController.uploadSingle);
router.post('/upload/multiple', uploadController.uploadMultiple);

module.exports = router;
