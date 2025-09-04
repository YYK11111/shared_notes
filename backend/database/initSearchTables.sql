-- 搜索索引表，用于存储笔记的索引数据
CREATE TABLE IF NOT EXISTS search_index (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT (title, content) WITH PARSER ngram,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 搜索屏蔽表，用于存储不参与前台搜索的笔记
CREATE TABLE IF NOT EXISTS search_blocked_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  note_title VARCHAR(255) NOT NULL,
  blocked_by INT NOT NULL,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_by) REFERENCES admins(id) ON DELETE SET NULL,
  UNIQUE KEY unique_note_id (note_id)
) ENGINE=InnoDB;

-- 搜索日志表，用于记录搜索历史
CREATE TABLE IF NOT EXISTS search_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  user_ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  result_count INT DEFAULT 0
) ENGINE=InnoDB;

-- 笔记阅读量表，用于记录笔记的阅读数据
CREATE TABLE IF NOT EXISTS note_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  user_ip VARCHAR(45) DEFAULT NULL,
  view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 曝光量记录表，用于记录笔记的曝光数据
CREATE TABLE IF NOT EXISTS exposure_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  user_ip VARCHAR(45) DEFAULT NULL,
  exposure_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_page VARCHAR(100) DEFAULT NULL, -- 来源页面（如首页、分类页等）
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 为notes表添加全文索引
ALTER TABLE notes ADD FULLTEXT IF NOT EXISTS idx_notes_fulltext (title, content) WITH PARSER ngram;

-- 初始化填充搜索索引表
INSERT IGNORE INTO search_index (note_id, title, content)
SELECT id, title, content FROM notes WHERE status = 1;