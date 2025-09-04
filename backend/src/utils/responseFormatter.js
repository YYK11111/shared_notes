// 响应格式化工具

// 成功响应
const successResponse = (data = null, message = '操作成功') => {
  return {
    code: 200,
    data,
    msg: message
  };
};

// 创建成功响应
const createdResponse = (data = null, message = '创建成功') => {
  return {
    code: 201,
    data,
    msg: message
  };
};

// 错误响应
const errorResponse = (message = '操作失败', code = 400) => {
  return {
    code: code,
    data: null,
    msg: message
  };
};

// 分页响应
const paginatedResponse = (list = [], total = 0, page = 1, pageSize = 10, message = '获取成功') => {
  return {
    code: 200,
    data: {
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    },
    msg: message
  };
};

// 未授权响应
const unauthorizedResponse = (message = '未授权，请先登录') => {
  return {
    code: 401,
    data: null,
    msg: message
  };
};

// 禁止访问响应
const forbiddenResponse = (message = '无权限执行此操作') => {
  return {
    code: 403,
    data: null,
    msg: message
  };
};

// 资源不存在响应
const notFoundResponse = (message = '请求的资源不存在') => {
  return {
    code: 404,
    data: null,
    msg: message
  };
};

// 服务器错误响应
const serverErrorResponse = (message = '系统内部错误，请稍后重试') => {
  return {
    code: 500,
    data: null,
    msg: message
  };
};

// 请求过于频繁响应
const tooManyRequestsResponse = (message = '请求过于频繁，请稍后再试') => {
  return {
    code: 429,
    data: null,
    msg: message
  };
};

// 验证失败响应
const validationErrorResponse = (errors = [], message = '验证失败') => {
  return {
    code: 422,
    data: {
      errors
    },
    msg: message
  };
};

// 格式化错误对象为字符串
const formatError = (error) => {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
};

// 构建API响应对象
const buildResponse = (code, data, message) => {
  return {
    code,
    data,
    msg: message
  };
};

// 处理数据库错误
const handleDatabaseError = (error) => {
  console.error('Database Error:', error);
  
  // 根据错误代码返回不同的错误消息
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return errorResponse('数据已存在', 409);
    case 'ER_NO_REFERENCED_ROW_2':
      return errorResponse('引用的数据不存在', 404);
    case 'ER_ROW_IS_REFERENCED_2':
      return errorResponse('数据已被引用，无法删除', 409);
    case 'ER_DATA_TOO_LONG':
      return errorResponse('数据长度超过限制', 413);
    default:
      return serverErrorResponse();
  }
};

// 处理JWT错误
const handleJwtError = (error) => {
  console.error('JWT Error:', error);
  
  if (error.name === 'TokenExpiredError') {
    return unauthorizedResponse('令牌已过期，请重新登录');
  } else if (error.name === 'JsonWebTokenError') {
    return unauthorizedResponse('无效的令牌');
  } else {
    return unauthorizedResponse();
  }
};

// 处理验证错误
const handleValidationError = (validationResult) => {
  if (!validationResult || !validationResult.error) {
    return null;
  }
  
  const errors = validationResult.error.details.map(detail => ({
    field: detail.context ? detail.context.key : 'unknown',
    message: detail.message
  }));
  
  return validationErrorResponse(errors);
};

// 包装异步控制器
const asyncHandler = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// 标准化API响应
const standardizeResponse = (req, res, next) => {
  // 扩展res对象，添加格式化响应方法
  res.success = (data, message) => {
    res.json(successResponse(data, message));
  };
  
  res.created = (data, message) => {
    res.status(201).json(createdResponse(data, message));
  };
  
  res.error = (message, code) => {
    res.status(code || 400).json(errorResponse(message, code));
  };
  
  res.paginated = (list, total, page, pageSize, message) => {
    res.json(paginatedResponse(list, total, page, pageSize, message));
  };
  
  res.unauthorized = (message) => {
    res.status(401).json(unauthorizedResponse(message));
  };
  
  res.forbidden = (message) => {
    res.status(403).json(forbiddenResponse(message));
  };
  
  res.notFound = (message) => {
    res.status(404).json(notFoundResponse(message));
  };
  
  res.serverError = (message) => {
    res.status(500).json(serverErrorResponse(message));
  };
  
  res.tooManyRequests = (message) => {
    res.status(429).json(tooManyRequestsResponse(message));
  };
  
  res.validationError = (errors, message) => {
    res.status(422).json(validationErrorResponse(errors, message));
  };
  
  next();
};

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  tooManyRequestsResponse,
  validationErrorResponse,
  formatError,
  buildResponse,
  handleDatabaseError,
  handleJwtError,
  handleValidationError,
  asyncHandler,
  standardizeResponse
};