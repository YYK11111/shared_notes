const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/logger');
const { successResponse: formatSuccess, errorResponse: formatError } = require('../utils/responseFormatter');
const sensitiveWordService = require('../services/sensitiveWordService');

// 获取敏感词列表接口
router.get('/sensitive-words', authMiddleware, async (req, res) => {
  try {
    const sensitiveWords = await sensitiveWordService.getAllSensitiveWords();
    return res.json(formatSuccess(sensitiveWords, '获取敏感词列表成功'));
  } catch (error) {
    console.error('获取敏感词列表失败:', error);
    return res.status(500).json(formatError('获取敏感词列表失败，请稍后重试', 500));
  }
});

// 添加敏感词接口
router.post('/sensitive-word', authMiddleware, async (req, res) => {
  try {
    const { word } = req.body;
    const user = req.user;
    
    const newWord = await sensitiveWordService.addSensitiveWord(word);
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '添加敏感词', '系统', null, { word });
    
    return res.json(formatSuccess(newWord, '敏感词添加成功'));
  } catch (error) {
    console.error('添加敏感词失败:', error);
    if (error.message.includes('验证失败') || error.message.includes('已存在')) {
      return res.status(400).json(formatError(error.message, 400));
    }
    return res.status(500).json(formatError('添加敏感词失败，请稍后重试', 500));
  }
});

// 删除敏感词接口
router.delete('/sensitive-word/:word', authMiddleware, async (req, res) => {
  try {
    const { word } = req.params;
    const user = req.user;
    
    await sensitiveWordService.removeSensitiveWord(word);
    
    // 记录操作日志
    await logAdminAction(user.id, user.username, '删除敏感词', '系统', null, { word });
    
    return res.json(formatSuccess(null, '敏感词删除成功'));
  } catch (error) {
    console.error('删除敏感词失败:', error);
    if (error.message.includes('未找到')) {
      return res.status(404).json(formatError(error.message, 404));
    }
    return res.status(500).json(formatError('删除敏感词失败，请稍后重试', 500));
  }
});

module.exports = router;