// 笔记数据结构标准化处理
export function normalizeNote(raw) {
  // 处理分类信息，提取name并以逗号分隔
  let categoriesText = '未分类';
  if (Array.isArray(raw.categories) && raw.categories.length > 0) {
    categoriesText = raw.categories
      .filter(cat => cat && cat.name)
      .map(cat => cat.name)
      .join(', ');
  } else if (typeof raw.categories === 'string') {
    // 如果已经是字符串则直接使用
    categoriesText = raw.categories;
  }
  
  return {
    id: raw.id,
    title: raw.title,
    // 优先使用下划线命名的html_content，其次是驼峰命名的htmlContent，最后才是content
    content: raw.html_content || raw.htmlContent || raw.content || '', 
    status: raw.status, // 1 已发布 0 草稿
    isTop: raw.is_top === 1,
    topExpire: raw.top_expire_time,
    isHomeRec: raw.is_home_recommend === 1,
    categories: categoriesText,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}