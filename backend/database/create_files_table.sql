-- 创建files表，用于存储所有类型文件的统一元数据
CREATE TABLE IF NOT EXISTS files (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键（非业务用）',
  `file_id` VARCHAR(64) NOT NULL COMMENT '文件唯一ID（业务用，如UUID）',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始文件名（如"头像.png"）',
  `file_type` VARCHAR(32) NOT NULL COMMENT '文件类型（如image/jpeg、application/pdf）',
  `file_size` INT UNSIGNED NOT NULL COMMENT '文件大小（单位：字节）',
  `storage_path` VARCHAR(255) NOT NULL COMMENT '本地存储绝对路径（如"./uploads/2024/09/avatar/a3f7d92c.jpg"）',
  `business_type` VARCHAR(32) NOT NULL COMMENT '关联业务类型（如avatar=头像、article=文章图片）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_file_id` (`file_id`),  -- 确保file_id唯一
  KEY `idx_business_type` (`business_type`)  -- 按业务类型查询优化
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用文件元数据表';