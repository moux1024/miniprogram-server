const pool = require('../config/database');

// 获取功能列表
async function getFunctions(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, image_url, detail_images, sort_order FROM functions WHERE status = 1 ORDER BY sort_order ASC, id DESC'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取功能列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取功能列表失败'
    });
  }
}

// 获取功能详情
async function getFunctionById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM functions WHERE id = ? AND status = 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '功能不存在'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('获取功能详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取功能详情失败'
    });
  }
}

module.exports = {
  getFunctions,
  getFunctionById
};
