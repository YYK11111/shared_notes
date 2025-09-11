import React, { useState, useEffect } from 'react';
import { 
  getAllFileConfigs, 
  setFileMaxSize, 
  setFileAllowedTypes, 
  updateFileConfig 
} from '../api/fileConfigApi';

const FileConfigSettings = () => {
  // 配置状态
  const [configs, setConfigs] = useState({
    'file.max_size': 12, // 默认12MB
    'file.max_count': 5, // 默认5个文件
    'file.enable': 1, // 默认启用
    'file.allowed_types': JSON.stringify(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])
  });
  
  // UI状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    maxSizeMB: 12,
    maxCount: 5,
    enableFileUpload: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  });

  // 预定义的常用文件类型
  const commonFileTypes = [
    { name: 'JPEG图片', value: 'image/jpeg' },
    { name: 'PNG图片', value: 'image/png' },
    { name: 'GIF图片', value: 'image/gif' },
    { name: 'WebP图片', value: 'image/webp' },
    { name: 'PDF文档', value: 'application/pdf' },
    { name: 'Word文档', value: 'application/msword' },
    { name: 'Excel表格', value: 'application/vnd.ms-excel' },
    { name: 'PowerPoint演示', value: 'application/vnd.ms-powerpoint' },
    { name: 'ZIP压缩包', value: 'application/zip' },
    { name: '文本文件', value: 'text/plain' }
  ];

  // 加载配置
  useEffect(() => {
    loadConfigs();
  }, []);

  // 从API加载配置
  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const fetchedConfigs = await getAllFileConfigs();
      setConfigs(fetchedConfigs);
      
      // 更新表单数据
      if (fetchedConfigs['file.max_size']) {
        formData.maxSizeMB = parseFloat(fetchedConfigs['file.max_size']);
      }
      
      if (fetchedConfigs['file.max_count']) {
        formData.maxCount = parseInt(fetchedConfigs['file.max_count']);
      }
      
      if (fetchedConfigs['file.enable'] !== undefined) {
        formData.enableFileUpload = parseInt(fetchedConfigs['file.enable']) === 1;
      }
      
      if (fetchedConfigs['file.allowed_types']) {
        try {
          formData.allowedTypes = JSON.parse(fetchedConfigs['file.allowed_types']);
        } catch (e) {
          console.warn('解析文件类型配置失败，使用默认值');
        }
      }
      
      setFormData({ ...formData });
    } catch (err) {
      setError('加载配置失败：' + err.message);
      console.error('加载配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // 处理文件类型选择变化
  const handleFileTypeChange = (type) => {
    setFormData(prev => {
      const updatedTypes = prev.allowedTypes.includes(type)
        ? prev.allowedTypes.filter(t => t !== type)
        : [...prev.allowedTypes, type];
      return {
        ...prev,
        allowedTypes: updatedTypes
      };
    });
  };

  // 添加自定义文件类型
  const handleAddCustomType = (e) => {
    e.preventDefault();
    const customType = e.target.customType.value.trim();
    if (customType && !formData.allowedTypes.includes(customType)) {
      setFormData(prev => ({
        ...prev,
        allowedTypes: [...prev.allowedTypes, customType]
      }));
      e.target.customType.value = '';
    }
  };

  // 保存文件大小配置
  const saveMaxSize = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      await setFileMaxSize(formData.maxSizeMB);
      setSuccessMessage('文件大小配置保存成功');
      // 重新加载配置以确保一致性
      await loadConfigs();
    } catch (err) {
      setError('保存文件大小配置失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 保存文件类型配置
  const saveAllowedTypes = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      await setFileAllowedTypes(formData.allowedTypes);
      setSuccessMessage('文件类型配置保存成功');
    } catch (err) {
      setError('保存文件类型配置失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 保存其他配置
  const saveOtherConfig = async (key, value) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      await updateFileConfig(key, value);
      setSuccessMessage('配置保存成功');
    } catch (err) {
      setError('保存配置失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 保存最大文件数量
  const saveMaxCount = () => {
    saveOtherConfig('file.max_count', formData.maxCount);
  };

  // 保存启用状态
  const saveEnableStatus = () => {
    saveOtherConfig('file.enable', formData.enableFileUpload ? 1 : 0);
  };

  return (
    <div className="file-config-settings">
      <h2>文件上传配置</h2>
      
      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="config-section">
        <h3>文件大小限制</h3>
        <div className="config-item">
          <label htmlFor="maxSizeMB">最大文件大小 (MB):</label>
          <input
            id="maxSizeMB"
            type="number"
            name="maxSizeMB"
            value={formData.maxSizeMB}
            onChange={handleInputChange}
            min="1"
            max="1000"
            step="1"
            disabled={loading}
          />
          <button onClick={saveMaxSize} disabled={loading}>
            保存
          </button>
        </div>
      </div>
      
      <div className="config-section">
        <h3>文件数量限制</h3>
        <div className="config-item">
          <label htmlFor="maxCount">单次上传最大文件数量:</label>
          <input
            id="maxCount"
            type="number"
            name="maxCount"
            value={formData.maxCount}
            onChange={handleInputChange}
            min="1"
            max="100"
            step="1"
            disabled={loading}
          />
          <button onClick={saveMaxCount} disabled={loading}>
            保存
          </button>
        </div>
      </div>
      
      <div className="config-section">
        <h3>文件上传开关</h3>
        <div className="config-item">
          <label>
            <input
              type="checkbox"
              name="enableFileUpload"
              checked={formData.enableFileUpload}
              onChange={handleInputChange}
              disabled={loading}
            />
            启用文件上传功能
          </label>
          <button onClick={saveEnableStatus} disabled={loading}>
            保存
          </button>
        </div>
      </div>
      
      <div className="config-section">
        <h3>允许的文件类型</h3>
        <div className="file-types-list">
          {commonFileTypes.map(type => (
            <label key={type.value} className="file-type-option">
              <input
                type="checkbox"
                checked={formData.allowedTypes.includes(type.value)}
                onChange={() => handleFileTypeChange(type.value)}
                disabled={loading}
              />
              <span>{type.name} ({type.value})</span>
            </label>
          ))}
        </div>
        
        <div className="custom-type-form">
          <form onSubmit={handleAddCustomType}>
            <input
              type="text"
              name="customType"
              placeholder="添加自定义MIME类型，如：application/zip"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>添加</button>
          </form>
        </div>
        
        <div className="current-types">
          <h4>当前已选文件类型:</h4>
          <ul>
            {formData.allowedTypes.map((type, index) => (
              <li key={index}>
                {type} 
                <button 
                  onClick={() => handleFileTypeChange(type)}
                  disabled={loading}
                  className="remove-type-btn"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <button onClick={saveAllowedTypes} disabled={loading || formData.allowedTypes.length === 0}>
          保存文件类型配置
        </button>
      </div>
      
      <div className="config-actions">
        <button onClick={loadConfigs} disabled={loading} className="reload-btn">
          刷新配置
        </button>
      </div>

      <style jsx>{`
        .file-config-settings {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h2 {
          color: #333;
          margin-bottom: 20px;
        }
        
        h3 {
          color: #555;
          margin-top: 25px;
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        
        h4 {
          color: #666;
          margin: 15px 0 10px 0;
        }
        
        .config-section {
          margin-bottom: 20px;
          padding: 15px;
          background: white;
          border-radius: 6px;
        }
        
        .config-item {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 10px;
        }
        
        .config-item label {
          flex: 0 0 200px;
          font-weight: 500;
        }
        
        input[type="number"],
        input[type="text"] {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          flex: 1;
          max-width: 200px;
        }
        
        input[type="checkbox"] {
          margin-right: 8px;
        }
        
        button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }
        
        button:hover:not(:disabled) {
          background: #45a049;
        }
        
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .loading {
          padding: 10px;
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          color: #1565c0;
          margin-bottom: 15px;
        }
        
        .error-message {
          padding: 10px;
          background: #ffebee;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          color: #c62828;
          margin-bottom: 15px;
        }
        
        .success-message {
          padding: 10px;
          background: #e8f5e9;
          border: 1px solid #c8e6c9;
          border-radius: 4px;
          color: #2e7d32;
          margin-bottom: 15px;
        }
        
        .file-types-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .file-type-option {
          display: flex;
          align-items: center;
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #fafafa;
          cursor: pointer;
        }
        
        .file-type-option input[type="checkbox"] {
          flex-shrink: 0;
        }
        
        .file-type-option span {
          margin-left: 8px;
          font-size: 14px;
        }
        
        .custom-type-form {
          margin: 15px 0;
          display: flex;
          gap: 10px;
        }
        
        .custom-type-form input {
          flex: 1;
          max-width: none;
        }
        
        .current-types ul {
          list-style: none;
          padding: 0;
          margin: 10px 0;
        }
        
        .current-types li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: #e3f2fd;
          border-radius: 4px;
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .remove-type-btn {
          background: #f44336;
          width: 24px;
          height: 24px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
        }
        
        .remove-type-btn:hover {
          background: #d32f2f;
        }
        
        .config-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        
        .reload-btn {
          background: #2196F3;
        }
        
        .reload-btn:hover {
          background: #0b7dda;
        }
      `}</style>
    </div>
  );
};

export default FileConfigSettings;