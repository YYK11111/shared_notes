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
  blocked_by INT DEFAULT NULL,
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

-- 初始化填充搜索索引表
INSERT IGNORE INTO search_index (note_id, title, content)
SELECT id, title, content FROM notes WHERE status = 1;