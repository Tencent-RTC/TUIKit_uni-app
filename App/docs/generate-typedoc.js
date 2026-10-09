#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 引入配置文件
const { CONFIG } = require('./config.js');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dirPath}`);
  }
}

/**
 * 将UTS文件转换为TS文件
 */
function convertUtsToTs(utsPath, tsPath) {
  try {
    let content = fs.readFileSync(utsPath, 'utf8');

    // 转换UTS到TS的基本转换
    content = content
      // 移除可能导致TypeScript解析问题的特殊标记
      .replace(/export\s+type/g, 'export interface')
      .replace(/\/\*\*/g, '/**')
      .replace(/\*\//g, '*/');

    fs.writeFileSync(tsPath, content, 'utf8');
    console.log(`转换UTS到TS: ${utsPath} -> ${tsPath}`);
  } catch (error) {
    console.error(`转换UTS文件失败: ${error.message}`);
    throw error;
  }
}

/**
 * 获取模块的专业介绍
 * 从state文件的@module_description JSDoc标签中提取
 */
function getModuleDescription(moduleName, allReactiveData) {
  // 找到该模块对应的文件路径
  const moduleFilePath = CONFIG.stateFiles.find(filePath => {
    const fileName = path.basename(filePath, '.ts');
    return fileName === moduleName;
  });

  if (moduleFilePath) {
    try {
      // 直接读取文件内容以提取模块级注释
      const fileContent = fs.readFileSync(moduleFilePath, 'utf8');

      // 首先，找到包含@module_description的JSDoc注释块
      // 从/**开始，到*/结束，并且包含@module_description
      const commentBlockMatch = fileContent.match(/\/\*\*[\s\S]*?@module_description[\s\S]*?\*\//);

      if (commentBlockMatch) {
        const commentBlock = commentBlockMatch[0];

        // 拆分注释块为行
        const lines = commentBlock.split('\n');
        let descriptionLines = [];
        let inDescription = false;

        // 遍历每行，提取@module_description后面的内容
        for (let line of lines) {
          // 找到@module_description标签行
          if (line.includes('@module_description')) {
            inDescription = true;
            // 提取标签后的内容（如果有）
            const afterTag = line.replace(/.*@module_description\s*/, '');
            if (afterTag.trim()) {
              descriptionLines.push(afterTag.trim());
            }
          }
          // 收集描述内容，直到遇到新的@标签或注释结束
          else if (inDescription && !line.includes('@') && line.trim() !== '*/') {
            // 移除行首的 * 和空格
            const cleanedLine = line.replace(/^\s*\*\s?/, '').trim();
            if (cleanedLine) {
              descriptionLines.push(cleanedLine);
            }
          }
          // 遇到其他@标签，结束收集
          else if (line.trim().startsWith('* @') && inDescription) {
            break;
          }
        }

        // 如果有收集到描述内容
        if (descriptionLines.length > 0) {
          // 保持原始换行格式，转换为HTML格式
          const description = descriptionLines.join('\n').trim();
          // 将换行符转换为HTML换行标签
          const htmlDescription = description.replace(/\n/g, '<br>');
          return `<div class="module-description-content">${htmlDescription}</div>`;
        }
      }
    } catch (error) {
      console.error(`读取模块文件失败: ${error.message}`);
    }
  }

  // 如果没有找到@module_description，返回空或默认值
  return '';
}

/**
 * 创建基础HTML模板
 */
function createBaseHtmlTemplate(title, content, moduleData = {}, moduleFunctions = {}) {
  // 提取所有section和子section
  const sections = [];
  const sectionRegex = /<section\s+id="([^"]*)">\s*<h([234])>([^<]*)<\/h[234]>/g;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      id: match[1],
      title: match[3],
      level: parseInt(match[2]),
      isModule: match[1].startsWith('module-'), // 标识是否为模块section
      isDataSection: match[1].startsWith('data-'), // 标识是否为Data section
      isApiSection: match[1].startsWith('api-') // 标识是否为API section
    });
  }

  // 生成目录HTML
  let tocHtml = '<div class="toc">\n';
  tocHtml += '  <h3>目录</h3>\n';
  tocHtml += '  <ul>\n';

  let currentModule = null;
  let isInsideModule = false;
  let isInsideDataOrApi = false;

  sections.forEach(section => {
    // 处理总览部分（非模块）
    if (section.id === 'overview') {
      tocHtml += `    <li><a href="#${section.id}">${section.title}</a></li>\n`;
      return;
    }

    // 如果是模块section
    if (section.isModule) {
      // 如果当前在另一个模块内，需要先结束之前的模块
      if (isInsideModule) {
        if (isInsideDataOrApi) {
          tocHtml += '        </ul>\n';
          tocHtml += '      </li>\n';
          isInsideDataOrApi = false;
        }
        tocHtml += '      </ul>\n';
        tocHtml += '    </li>\n';
      }

      // 开始新模块
      currentModule = section;
      isInsideModule = true;
      tocHtml += `    <li><a href="#${section.id}">${section.title}</a>\n`;
      tocHtml += '      <ul>\n';
    }
    // 如果是Data或API section
    else if (section.id.startsWith('data-') || section.id.startsWith('api-')) {
      if (isInsideDataOrApi) {
        tocHtml += '        </ul>\n';
        tocHtml += '      </li>\n';
      }

      const sectionType = section.id.startsWith('data-') ? '响应式数据' : '接口函数';
      const moduleName = section.id.replace(/^(data-|api-)/, '');
      tocHtml += `      <li><a href="#${section.id}" class="section-category">${sectionType}</a>\n`;
      tocHtml += '        <ul>\n';

      // 添加具体的数据项或方法
      if (section.id.startsWith('data-') && moduleData[moduleName]) {
        moduleData[moduleName].forEach(data => {
          tocHtml += `          <li><a href="#${data.name}" class="sub-item">${data.name}</a></li>\n`;
        });
      } else if (section.id.startsWith('api-') && moduleFunctions[moduleName]) {
        moduleFunctions[moduleName].forEach(fn => {
          tocHtml += `          <li><a href="#${fn.name}" class="sub-item">${fn.name}</a></li>\n`;
        });
      }

      isInsideDataOrApi = true;
    }
    // 如果是函数或数据section且当前在Data/API内（现在这些是div而不是section）
    else if (isInsideDataOrApi) {
      // 跳过，因为现在Data和API部分直接包含实现，不再有独立的section
    }
    // 如果是函数section且当前在模块内（兼容旧格式）
    else if (isInsideModule) {
      tocHtml += `        <li><a href="#${section.id}">${section.title}</a></li>\n`;
    }
    // 其他情况作为顶级项
    else {
      tocHtml += `    <li><a href="#${section.id}">${section.title}</a></li>\n`;
    }
  });

  // 如果最后在Data/API内，需要结束它
  if (isInsideDataOrApi) {
    tocHtml += '        </ul>\n';
    tocHtml += '      </li>\n';
  }

  // 如果最后在模块内，需要结束它
  if (isInsideModule) {
    tocHtml += '      </ul>\n';
    tocHtml += '    </li>\n';
  }

  tocHtml += '  </ul>\n';
  tocHtml += '</div>\n';

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="../assets/styles.css">
</head>
<body>
    <div class="sidebar">
        ${tocHtml}
    </div>
    
    <div class="content">
        <header>
            <h1>${title}</h1>
        </header>
        
        <div class="search-container">
            <input type="text" class="search-input" placeholder="搜索API..." onkeyup="search(this.value)">
        </div>
        
        ${content}
        
        <script src="../assets/search.js"></script>
    </div>
</body>
</html>
  `;
}

/**
 * 解析TS文件中的类型定义和注释
 */
function parseTsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const interfaces = [];

  // 按行解析文件，更准确地匹配类型定义和其对应的注释
  const lines = content.split('\n');
  let currentComment = '';
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测注释开始
    if (line.trim() === '/**') {
      inComment = true;
      currentComment = '';
      continue;
    }

    // 收集注释内容
    if (inComment) {
      if (line.trim() === '*/') {
        inComment = false;
      } else {
        // 移除星号和前导空格
        const cleanedLine = line.replace(/^\s*\*\s?/, '');
        currentComment += (currentComment ? '\n' : '') + cleanedLine;
      }
      continue;
    }

    // 检查是否是类型定义行（type/interface/enum）
    if (currentComment) {
      const typeMatch = line.match(/export\s+(?:interface|type)\s+(\w+)\s*[:={]/);
      const enumMatch = !typeMatch ? line.match(/export\s+enum\s+(\w+)\s*\{/) : null;
      const match = typeMatch || enumMatch;
      if (match) {
        const typeName = match[1];
        interfaces.push({
          name: typeName,
          comment: currentComment.trim(),
          fullMatch: line,
          isEnum: !!enumMatch
        });
        currentComment = '';
      } else if (!line.trim().startsWith('*') && !line.trim().startsWith('//') && line.trim() !== '') {
        // 遇到非注释、非空行但不是类型定义，清除当前注释
        currentComment = '';
      }
    }
  }

  return interfaces;
}

/**
 * 解析TS文件中的函数定义和注释
 */
function parseFunctions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const functions = [];

  // 逐行解析文件内容，更可靠地识别函数和其注释
  const lines = content.split('\n');
  let currentComment = [];
  let inJsDoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测JSDoc注释开始
    if (line.trim() === '/**') {
      inJsDoc = true;
      currentComment = [];
      continue;
    }

    // 收集JSDoc注释内容
    if (inJsDoc) {
      if (line.trim() === '*/') {
        inJsDoc = false;
      } else {
        // 移除星号和前导空格
        const cleanedLine = line.replace(/^\s*\*\s?/, '');
        currentComment.push(cleanedLine);
      }
      continue;
    }

    // 检查注释后的函数定义
    if (currentComment.length > 0) {
      const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const params = functionMatch[2];
        const comment = currentComment.join('\n').trim();

        // 从注释中提取@memberof标签作为模块名
        let moduleName = 'default';
        const memberOfMatch = comment.match(/@memberof\s+module:([\w.]+)/);
        if (memberOfMatch && memberOfMatch[1]) {
          moduleName = memberOfMatch[1];
        }

        // 固定分类为API
        let category = 'API';

        // 检查是否为内部函数
        const isInternal = comment.includes('@internal');
        if (isInternal) {
          category = 'Internal';
        }

        functions.push({
          name: functionName,
          params: params,
          comment: comment,
          fullMatch: line,
          module: moduleName,
          category: category
        });

        currentComment = [];
      }
    }
  }

  return functions;
}

/**
 * 解析TS文件中的响应式数据定义和注释
 */
function parseReactiveData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const reactiveData = [];

  // 逐行解析文件内容，识别响应式数据
  const lines = content.split('\n');
  let currentComment = [];
  let inJsDoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测JSDoc注释开始
    if (line.trim() === '/**') {
      inJsDoc = true;
      currentComment = [];
      continue;
    }

    // 收集JSDoc注释内容
    if (inJsDoc) {
      if (line.trim() === '*/') {
        inJsDoc = false;
      } else {
        // 移除星号和前导空格
        const cleanedLine = line.replace(/^\s*\*\s?/, '');
        currentComment.push(cleanedLine);
      }
      continue;
    }

    // 检查注释后的响应式数据定义
    if (currentComment.length > 0) {
      let dataName = null;
      let dataType = null;

      // 模式1: 匹配 ref() 定义的响应式数据
      // 如: const xxx = ref<Type>(...)
      // 需要处理嵌套的泛型类型，如 ref<Map<string, number> | null>
      const refMatch = line.match(/const\s+(\w+)\s*=\s*ref<(.+)>\(/);
      if (refMatch) {
        dataName = refMatch[1];
        // 提取类型参数，处理嵌套泛型
        let typeStr = refMatch[2];
        // 如果类型参数中有多个 >，说明有嵌套泛型，需要找到最后一个 >
        let lastBracketIndex = typeStr.lastIndexOf('>');
        if (lastBracketIndex > 0 && lastBracketIndex < typeStr.length - 1) {
          // 如果不是最后一个字符，则说明匹配有问题，需要重新匹配
          const fullMatch = line.match(/const\s+(\w+)\s*=\s*ref<(.+)\>\(/);
          if (fullMatch) {
            typeStr = fullMatch[2];
          }
        }
        dataType = typeStr;
      }

      // 模式2: 匹配带 Ref<T> 类型注解的赋值（如从 getGlobalState() 取值）
      // 如: const loginUserInfo: Ref<UserProfileParam | undefined> = getGlobalState().loginUserInfo;
      if (!dataName) {
        const refTypeMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*:\s*Ref<(.+?)>\s*=/);
        if (refTypeMatch) {
          dataName = refTypeMatch[1];
          dataType = refTypeMatch[2];
        }
      }

      // 模式3: 匹配无类型注解的 getGlobalState() 赋值，通过 JSDoc @type 标签提取类型
      // 如: const liveList = getGlobalState().liveList;
      // JSDoc 中有 @type {Ref<LiveInfoParam[]>}
      if (!dataName) {
        const globalStateMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*getGlobalState\(\)\.\w+/);
        if (globalStateMatch) {
          dataName = globalStateMatch[1];
          const comment = currentComment.join('\n');
          // 从 @type {Ref<...>} 中提取类型
          const typeTagMatch = comment.match(/@type\s+\{Ref<(.+?)>\}/);
          if (typeTagMatch) {
            dataType = typeTagMatch[1];
          } else {
            dataType = 'unknown';
          }
        }
      }

      if (dataName && dataType) {
        const comment = currentComment.join('\n').trim();

        // 从注释中提取@memberof标签作为模块名
        let moduleName = 'default';
        const memberOfMatch = comment.match(/@memberof\s+module:([\w.]+)/);
        if (memberOfMatch && memberOfMatch[1]) {
          moduleName = memberOfMatch[1];
        }

        // 固定分类为Data
        let category = 'Data';

        // 检查是否为内部数据
        const isInternal = comment.includes('@internal');

        reactiveData.push({
          name: dataName,
          type: dataType,
          comment: comment,
          fullMatch: line,
          module: moduleName,
          category: category,
          isInternal: isInternal
        });

        currentComment = [];
      }
    }
  }

  return reactiveData;
}

/**
 * 将Markdown表格转换为HTML表格
 */
function markdownTableToHtml(markdownTable) {
  const lines = markdownTable.trim().split('\n');
  if (lines.length < 2) return markdownTable; // 不是有效的表格格式

  let html = '<table class="param-table">\n';

  // 处理表头
  const headerLine = lines[0].trim();
  if (headerLine.startsWith('|')) {
    const headers = headerLine.split('|').slice(1, -1).map(h => h.trim());
    html += '  <tr>\n';
    headers.forEach(header => {
      html += `    <th>${header}</th>\n`;
    });
    html += '  </tr>\n';
  }

  // 处理分隔线（第二行）
  if (lines.length > 1 && lines[1].includes('---')) {
    // 跳过分隔线
  }

  // 处理数据行
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      html += '  <tr>\n';
      cells.forEach(cell => {
        // 处理代码标记
        const processedCell = cell.replace(/`([^`]+)`/g, '<code>$1</code>');
        html += `    <td>${processedCell}</td>\n`;
      });
      html += '  </tr>\n';
    }
  }

  html += '</table>';
  return html;
}

/**
 * 处理remarks内容，自动检测并转换Markdown表格
 */
function processRemarks(remarks) {
  // 检测是否是Markdown表格格式
  const lines = remarks.split('\n');
  if (lines.length >= 3 &&
    lines[0].includes('|') &&
    lines[1].includes('---') &&
    lines[2].includes('|')) {
    return markdownTableToHtml(remarks);
  }

  // 检测是否是类型定义的可用值列表格式（适用于UserAllowType等联合类型）
  if (lines.length >= 2 && lines[0].includes('可用值：')) {
    // 创建表格HTML
    let html = '<table class="param-table">\n';
    html += '  <tr>\n';
    html += '    <th>值</th>\n';
    html += '    <th>说明</th>\n';
    html += '  </tr>\n';

    // 处理每个可用值行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-')) {
        // 匹配类似 "- `ALLOW_ANY`: 允许任何人" 的格式
        const match = line.match(/-\s*`([^`]+)`:\s*(.*)/);
        if (match) {
          const value = match[1];
          const desc = match[2];
          html += '  <tr>\n';
          html += `    <td><code>${value}</code></td>\n`;
          html += `    <td>${desc}</td>\n`;
          html += '  </tr>\n';
        }
      }
    }

    html += '</table>';
    return html;
  }

  // 如果不是表格格式，保持原有处理
  return `<p>${remarks}</p>`;
}

/**
 * 从TS文件内容中提取指定类型名的属性定义
 */
function extractTypeProperties(tsContent, typeName) {
  const properties = [];
  // 匹配 export type/interface TypeName = { ... } 或 export type/interface TypeName { ... }
  const typeBlockRegex = new RegExp(
    `export\\s+(?:interface|type)\\s+${typeName}\\s*(?:[:=]\\s*)?\\{([\\s\\S]*?)\\}`,
    'm'
  );
  const blockMatch = tsContent.match(typeBlockRegex);
  if (blockMatch) {
    const body = blockMatch[1];
    // 逐行解析属性，支持可选标记 ? 和函数类型
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
      // 匹配属性定义: propertyName?: Type;
      const propMatch = trimmed.match(/^(readonly\s+)?([\w]+)\s*(\?)?\s*:\s*(.+?)\s*;?\s*$/);
      if (propMatch) {
        properties.push({
          name: propMatch[2],
          optional: !!propMatch[3],
          type: propMatch[4].replace(/;$/, '').trim(),
          readonly: !!propMatch[1]
        });
      }
    }
  }
  return properties;
}

/**
 * 从TS文件内容中提取指定枚举名的成员定义
 */
function extractEnumMembers(tsContent, enumName) {
  const members = [];
  const enumBlockRegex = new RegExp(
    `export\\s+enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\}`,
    'm'
  );
  const blockMatch = tsContent.match(enumBlockRegex);
  if (blockMatch) {
    const body = blockMatch[1];
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
      // 匹配 MEMBER_NAME = value, 或 MEMBER_NAME,
      const memberMatch = trimmed.match(/^(\w+)\s*(?:=\s*(.+?))?\s*,?\s*$/);
      if (memberMatch) {
        members.push({
          name: memberMatch[1],
          value: memberMatch[2] || ''
        });
      }
    }
  }
  return members;
}

/**
 * 将类型字符串中的自定义类型名转换为带链接的HTML
 */
function linkifyType(typeStr) {
  const baseTypes = ['string', 'number', 'boolean', 'void', 'any', 'Map', 'undefined', 'null', 'Array', 'Object', 'Function', 'Promise', 'Ref', 'Record'];
  const customTypeRegex = /\b([A-Z][a-zA-Z0-9]+)\b/g;
  return typeStr
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(customTypeRegex, (match) => {
      if (!baseTypes.includes(match) && /^[A-Z]/.test(match)) {
        return `<a href="#${match}">${match}</a>`;
      }
      return match;
    });
}

/**
 * 生成interface.html文档
 */
function generateInterfaceDocs() {
  // 1. 从 interface.uts 收集类型定义
  const interfaceTsPath = path.join(CONFIG.tempDir, 'interface.ts');
  convertUtsToTs(CONFIG.interfaceUtsPath, interfaceTsPath);
  const utsInterfaces = parseTsFile(interfaceTsPath);
  const utsContent = fs.readFileSync(interfaceTsPath, 'utf8');

  // 2. 从所有 State 文件收集类型/枚举定义
  let allInterfaces = [...utsInterfaces];
  let allContents = { '__uts__': utsContent }; // 存储每个接口对应的文件内容

  // 标记 uts 接口对应的内容源
  utsInterfaces.forEach(iface => {
    iface._contentKey = '__uts__';
  });

  CONFIG.stateFiles.forEach(filePath => {
    const stateInterfaces = parseTsFile(filePath);
    const stateContent = fs.readFileSync(filePath, 'utf8');
    const contentKey = filePath;
    allContents[contentKey] = stateContent;

    stateInterfaces.forEach(iface => {
      // 跳过带 @module 标签的（那是模块声明，不是接口定义）
      if (iface.comment.includes('@module ') && !iface.comment.includes('@interface') && !iface.comment.includes('@typedef')) {
        return;
      }
      iface._contentKey = contentKey;
      allInterfaces.push(iface);
    });
  });

  // 去重（按名称，后出现的覆盖前面的）
  const interfaceMap = new Map();
  allInterfaces.forEach(iface => {
    interfaceMap.set(iface.name, iface);
  });
  const uniqueInterfaces = Array.from(interfaceMap.values());

  let content = '<section id="overview">\n<h2>接口定义总览</h2>\n<p>本页面包含所有的接口类型定义。</p>\n</section>\n';

  // 生成每个接口的文档
  uniqueInterfaces.forEach(iface => {
    const tsContent = allContents[iface._contentKey] || '';

    content += `\n<section id="${iface.name}">\n`;
    content += `  <h2>${iface.name}</h2>\n`;

    // 解析注释中的@remarks
    const remarksMatch = iface.comment.match(/@remarks[\s\S]+?(?=@(?!remarks)|$)/);

    // 提取基本描述（移除所有标签后的纯文字）
    let baseComment = iface.comment;
    if (remarksMatch) baseComment = baseComment.replace(remarksMatch[0], '');
    // 移除各种标签
    baseComment = baseComment.replace(/@interface\s+[\w]*/g, '');
    baseComment = baseComment.replace(/@typedef\s+[\s\S]+?(?=@|$)/g, '');
    baseComment = baseComment.replace(/@property\s+[\s\S]+?(?=@property|@memberof|@example|@remarks|$)/g, '');
    baseComment = baseComment.replace(/@param\s+[\s\S]+?(?=@param|@memberof|@example|@remarks|$)/g, '');
    baseComment = baseComment.replace(/@description\s+[\s\S]+?(?=@|$)/g, '');
    baseComment = baseComment.replace(/@memberof\s+[\s\S]+?(?=@|$)/g, '');
    baseComment = baseComment.replace(/@example[\s\S]+?(?=@|$)/g, '');
    baseComment = baseComment.replace(/@module\s+[\w]*/g, '');
    baseComment = baseComment.replace(/@module_description[\s\S]*/g, '');
    baseComment = baseComment.trim();

    if (baseComment) {
      const paragraphs = baseComment.split(/\n\s*\n/);
      const cleanedComment = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
      content += `  <div class="api-description">${cleanedComment}</div>\n`;
    }

    if (iface.isEnum) {
      // 枚举类型：从代码中提取成员
      const enumMembers = extractEnumMembers(tsContent, iface.name);

      // 同时从 @remarks 中提取描述映射
      const descMap = {};
      if (remarksMatch) {
        const remarksText = remarksMatch[0].replace('@remarks', '').trim();
        const descLines = remarksText.split('\n');
        descLines.forEach(line => {
          const match = line.match(/-\s*`([^`]+)`\s*[:：]\s*(.*)/);
          if (match) {
            descMap[match[1]] = match[2].trim();
          }
        });
      }

      if (enumMembers.length > 0) {
        content += `  <div class="params-table-container">\n`;
        content += `    <h4>枚举值</h4>\n`;
        content += `    <table class="param-table">\n`;
        content += `      <tr>\n`;
        content += `        <th>名称</th>\n`;
        content += `        <th>值</th>\n`;
        content += `        <th>说明</th>\n`;
        content += `      </tr>\n`;

        enumMembers.forEach(member => {
          const desc = descMap[member.name] || '';
          content += `      <tr>\n`;
          content += `        <td><code>${member.name}</code></td>\n`;
          content += `        <td>${member.value}</td>\n`;
          content += `        <td>${desc}</td>\n`;
          content += `      </tr>\n`;
        });

        content += `    </table>\n`;
        content += `  </div>\n`;
      }
    } else {
      // 类型/接口：从代码中提取属性
      const codeProperties = extractTypeProperties(tsContent, iface.name);

      // 从 JSDoc @param 中提取描述
      const paramDescMap = {};
      const paramMatches = iface.comment.match(/@param\s+\{([^\}]+)\}\s+([\w]+)\s*(?:-\s*([\s\S]+?))?(?=@param|@memberof|@example|@remarks|$)/g) || [];
      paramMatches.forEach(param => {
        const m = param.match(/@param\s+\{([^\}]+)\}\s+([\w]+)\s*(?:-\s*([\s\S]+))?/);
        if (m) {
          paramDescMap[m[2]] = { type: m[1], desc: (m[3] || '').trim() };
        }
      });

      // 从 JSDoc @property 中提取描述
      const propDescMap = {};
      const propMatches = iface.comment.match(/@property\s+\{([^\}]+)\}\s+(\[?[\w]+\]?)\s*(?:-?\s*([\s\S]+?))?(?=@property|@memberof|@example|@remarks|$)/g) || [];
      propMatches.forEach(prop => {
        const m = prop.match(/@property\s+\{([^\}]+)\}\s+\[?([\w]+)\]?\s*(?:-?\s*([\s\S]+))?/);
        if (m) {
          propDescMap[m[2]] = { type: m[1], desc: (m[3] || '').trim() };
        }
      });

      if (codeProperties.length > 0) {
        content += `  <div class="params-table-container">\n`;
        content += `    <h4>属性列表</h4>\n`;
        content += `    <table class="param-table">\n`;
        content += `      <tr>\n`;
        content += `        <th>Name</th>\n`;
        content += `        <th>Type</th>\n`;
        content += `        <th>Description</th>\n`;
        content += `      </tr>\n`;

        codeProperties.forEach(prop => {
          // 优先从 @param/@property 获取描述，没有则留空
          const jsdocParam = paramDescMap[prop.name] || propDescMap[prop.name];
          const desc = jsdocParam ? jsdocParam.desc : '';
          const typeStr = linkifyType(prop.type);
          const optionalMark = prop.optional ? ' (可选)' : '';
          const readonlyMark = prop.readonly ? '<em>readonly</em> ' : '';

          content += `      <tr>\n`;
          content += `        <td>${readonlyMark}${prop.name}</td>\n`;
          content += `        <td><span class="param-type">${typeStr}</span></td>\n`;
          content += `        <td>${desc}${optionalMark}</td>\n`;
          content += `      </tr>\n`;
        });

        content += `    </table>\n`;
        content += `  </div>\n`;
      } else if (paramMatches.length > 0) {
        // fallback: 如果从代码中没提取到属性，用 @param 注释
        content += `  <div class="params-table-container">\n`;
        content += `    <h4>属性列表</h4>\n`;
        content += `    <table class="param-table">\n`;
        content += `      <tr>\n`;
        content += `        <th>Name</th>\n`;
        content += `        <th>Type</th>\n`;
        content += `        <th>Description</th>\n`;
        content += `      </tr>\n`;

        paramMatches.forEach(param => {
          const paramMatch = param.match(/@param\s+\{([^\}]+)\}\s+([\w]+)\s*(?:-\s*([\s\S]+))?/);
          if (paramMatch) {
            const typeHtml = linkifyType(paramMatch[1]);
            content += `      <tr>\n`;
            content += `        <td>${paramMatch[2]}</td>\n`;
            content += `        <td><span class="param-type">${typeHtml}</span></td>\n`;
            content += `        <td>${(paramMatch[3] || '').trim()}</td>\n`;
            content += `      </tr>\n`;
          }
        });

        content += `    </table>\n`;
        content += `  </div>\n`;
      }
    }

    // 添加remarks（枚举已在上方处理了 remarks 中的值映射表，但其他 remarks 信息仍需显示）
    if (remarksMatch && !iface.isEnum) {
      const remarks = remarksMatch[0].replace('@remarks', '').trim();
      content += `  <div class="remarks">\n`;
      content += `    <h4>说明</h4>\n`;
      content += `    ${processRemarks(remarks)}\n`;
      content += `  </div>\n`;
    }

    content += `  </section>\n`;
  });

  const htmlContent = createBaseHtmlTemplate('Interface 接口文档', content);
  const targetHtmlPath = path.join(CONFIG.apiDir, 'interface.html');

  fs.writeFileSync(targetHtmlPath, htmlContent, 'utf8');
  console.log(`生成interface.html: ${targetHtmlPath}`);
  return true;
}

/**
 * 生成 index.html文档
 */
function generateIndexDocs() {
  let allFunctions = [];
  let allReactiveData = [];

  CONFIG.stateFiles.forEach(filePath => {
    const functions = parseFunctions(filePath);
    const reactiveData = parseReactiveData(filePath);

    // 过滤掉内部函数、没有注释的函数和没有有效module的函数
    const filteredFunctions = functions.filter(fn =>
      fn.comment.trim() !== '' && fn.category !== 'Internal' && fn.module && fn.module !== 'default'
    );

    // 过滤掉内部数据和没有注释的数据
    const filteredReactiveData = reactiveData.filter(data =>
      data.comment.trim() !== '' && !data.isInternal
    );

    allFunctions.push(...filteredFunctions);
    allReactiveData.push(...filteredReactiveData);
  });

  // 按模块分组函数和数据
  const functionsByModule = {};
  const dataByModule = {};

  allFunctions.forEach(fn => {
    if (!functionsByModule[fn.module]) {
      functionsByModule[fn.module] = [];
    }
    functionsByModule[fn.module].push(fn);
  });

  allReactiveData.forEach(data => {
    if (!dataByModule[data.module]) {
      dataByModule[data.module] = [];
    }
    dataByModule[data.module].push(data);
  });

  let content = '<section id="overview">\n<h2>atomicx-core sdk </h2>\n<p>atomicx-core sdk 是腾讯云最新推出的面向即时通信、音视频通话、视频直播、语聊房等场景的全新一代基于响应式的 API，您可以非常快速的在基于这组 API 构建自己的 UI 页面，它支持房间管理、屏幕分享、成员管理、麦位控制、基础美颜等丰富功能，同时基于 TRTC SDK，能够提供超低延时、高品质的音视频体验，本页面包含 atomicx-core sdk 的所有API接口，按功能模块分类展示。</p>\n</section>\n';

  // 遍历每个模块
  Object.keys(functionsByModule).forEach(moduleName => {
    const moduleFunctions = functionsByModule[moduleName];
    const moduleData = dataByModule[moduleName] || [];

    // 确保只处理非default模块和有内容的模块
    if (moduleName !== 'default' && (moduleFunctions.length > 0 || moduleData.length > 0)) {
      content += `\n<section id="module-${moduleName}">\n`;
      content += `  <h2>${moduleName}</h2>\n`;

      // 添加模块专业介绍
      const moduleDescription = getModuleDescription(moduleName, allReactiveData);
      content += `  <div class="module-description">\n`;
      content += `    ${moduleDescription}\n`;
      content += `  </div>\n`;

      // 生成 Data 部分
      if (moduleData.length > 0) {
        content += `  <section id="data-${moduleName}">\n`;
        content += `    <h3>响应式数据</h3>\n`;

        moduleData.forEach(data => {
          content += `    <div class="data-item" id="${data.name}">\n`;
          content += `      <h4>${data.name}</h4>\n`;
          content += `      <div class="api-signature">const ${data.name}: Ref<${data.type}></div>\n`;

          // 解析注释中的基础描述
          let baseComment = data.comment;

          // 提取@example标签（必须在清理其他标签之前提取）
          let exampleCode = '';
          const exampleMatch = baseComment.match(/@example\s+([\s\S]+?)(?=\n@[a-z]|$)/);
          if (exampleMatch) {
            exampleCode = exampleMatch[1].trim();

            // 清理示例代码，移除多余的标签和内容
            exampleCode = exampleCode.replace(/@memberof\s+module:[\w.]+/, '');
            exampleCode = exampleCode.replace(/@type\s+\{[^}]+\}/, '');
            exampleCode = exampleCode.trim();

            // HTML转义
            exampleCode = exampleCode
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          }

          // 移除@memberof、@type等标签
          baseComment = baseComment.replace(/@memberof\s+module:[\w.]+/, '');
          baseComment = baseComment.replace(/@type\s+\{[^}]+\}/, '');

          // 移除@module_description部分（包括其后的所有内容直到下一个@标签或末尾）
          baseComment = baseComment.replace(/@module_description\s+[\s\S]+?(?=@|$)/, '');

          // 移除@example部分
          baseComment = baseComment.replace(/@example\s+[\s\S]+?(?=\n@[a-z]|$)/, '');

          baseComment = baseComment.trim();

          if (baseComment) {
            content += `    <div class="api-description">${baseComment}</div>\n`;
          }

          // 添加类型信息
          content += `    <div class="type-info">\n`;
          content += `      <strong>类型:</strong> <code>Ref<${data.type}></code>\n`;
          content += `    </div>\n`;

          // 将示例代码放在最后
          if (exampleCode) {
            content += `    <div class="example">\n`;
            content += `      <h4>示例</h4>\n`;
            content += `      <pre><code>${exampleCode}</code></pre>\n`;
            content += `    </div>\n`;
          }

          content += `    </div>\n`;
        });

        content += `  </section>\n`;
      }

      // 生成 API 部分
      if (moduleFunctions.length > 0) {
        content += `  <section id="api-${moduleName}">\n`;
        content += `    <h3>接口函数</h3>\n`;

        moduleFunctions.forEach(fn => {
          content += `    <div class="api-item" id="${fn.name}">\n`;
          content += `      <h4>${fn.name}</h4>\n`;
          content += `      <div class="api-signature">function ${fn.name}(${fn.params})</div>\n`;

          // 解析注释中的@param和@example
          const paramMatches = [];
          const lines = fn.comment.split('\n');
          let inExample = false;
          let exampleContent = [];
          let baseCommentLines = [];

          // 手动解析注释，分别提取基础描述、参数和示例
          for (const line of lines) {
            if (line.trim().startsWith('@example')) {
              inExample = true;
              // 添加示例标记后的内容（去掉@example标签）
              const exampleStart = line.substring(line.indexOf('@example') + 8).trim();
              if (exampleStart) exampleContent.push(exampleStart);
            } else if (line.trim().startsWith('@')) {
              inExample = false;
              // 处理其他标签，如@param
              if (line.trim().startsWith('@param')) {
                paramMatches.push(line.trim());
              }
            } else if (inExample) {
              // 收集示例代码行
              exampleContent.push(line);
            } else {
              // 收集基础描述行
              baseCommentLines.push(line);
            }
          }

          const baseComment = baseCommentLines.join('\n').trim();

          if (baseComment) {
            content += `    <div class="api-description">${baseComment}</div>\n`;
          }

          // 添加参数表
          if (paramMatches.length > 0) {
            content += `    <h3>参数</h3>\n`;
            content += `    <table class="param-table">\n`;
            content += `      <tr>\n`;
            content += `        <th>参数名</th>\n`;
            content += `        <th>类型</th>\n`;
            content += `        <th>说明</th>\n`;
            content += `      </tr>\n`;

            paramMatches.forEach(paramMatch => {
              // 匹配JSDoc格式：@param {Type} paramName - description
              const jsDocMatch = paramMatch.trim().match(/^@param\s+\{([^}]+)\}\s+([^\s-]+)(?:\s*-\s*(.*))?$/);
              if (jsDocMatch) {
                const paramType = jsDocMatch[1].trim();
                const paramName = jsDocMatch[2].trim();
                const paramDesc = jsDocMatch[3]?.trim() || '';

                // 对于接口类型，创建到interface.html的链接
                let typeDisplay = paramType;
                if (/^[A-Z][a-zA-Z0-9]+$/.test(paramType)) {
                  typeDisplay = `<a href="interface.html#${paramType}">${paramType}</a>`;
                }

                content += `      <tr>\n`;
                content += `        <td>${paramName}</td>\n`;
                content += `        <td>${typeDisplay}</td>\n`;
                content += `        <td>${paramDesc}</td>\n`;
                content += `      </tr>\n`;
              } else {
                // 兼容原有的解析逻辑作为后备
                const paramParts = paramMatch.replace('@param', '').trim().split(/\s+/);
                if (paramParts.length >= 2) {
                  const paramName = paramParts[0];
                  let paramType = 'any';
                  let paramDesc = paramParts.slice(1).join(' ');

                  // 从参数名称中提取类型信息（如果参数名包含{type}格式）
                  const typeInNameMatch = paramName.match(/^\{([^}]+)\}$/);
                  if (typeInNameMatch && typeInNameMatch[1]) {
                    paramType = typeInNameMatch[1].trim();
                  }
                  // 从参数描述中提取类型信息
                  const typeMatch = paramDesc.match(/^\{([^}]+)\}$/);
                  if (typeMatch && typeMatch[1]) {
                    paramType = typeMatch[1].trim();
                    paramDesc = paramDesc.replace(typeMatch[0], '').trim();
                  }

                  // 对于接口类型，创建到interface.html的链接
                  let typeDisplay = paramType;
                  if (/^[A-Z][a-zA-Z0-9]+$/.test(paramType)) {
                    typeDisplay = `<a href="interface.html#${paramType}">${paramType}</a>`;
                  }

                  content += `      <tr>\n`;
                  content += `        <td>${paramName}</td>\n`;
                  content += `        <td>${typeDisplay}</td>\n`;
                  content += `        <td>${paramDesc}</td>\n`;
                  content += `      </tr>\n`;
                }
              }
            });

            content += `    </table>\n`;
          }

          // 添加example
          if (exampleContent.length > 0) {
            let example = exampleContent.join('\n').trim();
            // HTML转义
            example = example
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');

            content += `    <div class="example">\n`;
            content += `      <h4>示例</h4>\n`;
            content += `      <pre><code>${example}</code></pre>\n`;
            content += `    </div>\n`;
          }

          content += `    </div>\n`;
        });

        content += `  </section>\n`;
      }

      content += `</section>\n`;
    }
  });

  // 处理默认模块的函数（没有@memberof标签的函数）
  if (functionsByModule['default'] && functionsByModule['default'].length > 0) {
    content += `\n<section id="module-default">\n`;
    content += `  <h2>Default</h2>\n`;

    functionsByModule['default'].forEach(fn => {
      content += `  <section id="${fn.name}">\n`;
      content += `    <h3>${fn.name}</h3>\n`;
      content += `    <div class="api-signature">function ${fn.name}(${fn.params})</div>\n`;
      content += `  </section>\n`;
    });

    content += `</section>\n`;
  }

  const htmlContent = createBaseHtmlTemplate('atomicx-core sdk API 文档', content, dataByModule, functionsByModule);
  const targetHtmlPath = path.join(CONFIG.apiDir, 'index.html');
  fs.writeFileSync(targetHtmlPath, htmlContent, 'utf8');
  console.log(`生成 index.html: ${targetHtmlPath}`);
  return true;
}

/**
 * 创建搜索功能的JavaScript文件
 */
function createSearchJs() {
  const searchJsContent = `
// 简单的搜索功能实现
function search(filter) {
  filter = filter.toUpperCase();
  const sections = document.querySelectorAll('section');
  
  sections.forEach(section => {
    const text = section.textContent || section.innerText;
    if (text.toUpperCase().indexOf(filter) > -1) {
      section.style.display = "block";
    } else {
      section.style.display = "none";
    }
  });
}

// 页面加载完成后初始化
window.onload = function() {
  console.log('搜索功能已加载');
};
  `;

  ensureDir(CONFIG.assetsDir);
  fs.writeFileSync(path.join(CONFIG.assetsDir, 'search.js'), searchJsContent.trim(), 'utf8');
  console.log('创建search.js');
}

/**
 * 复制样式表到输出目录
 */
function copyStylesheet() {
  const stylesPath = path.join(__dirname, 'styles.css');
  const targetPath = path.join(CONFIG.assetsDir, 'styles.css');

  if (fs.existsSync(stylesPath)) {
    fs.copyFileSync(stylesPath, targetPath);
    console.log(`复制样式表: ${stylesPath} -> ${targetPath}`);
  } else {
    console.error(`样式表文件不存在: ${stylesPath}`);
  }
}

/**
 * 主函数
 */
async function generate() {
  try {
    ensureDir(CONFIG.tempDir);
    ensureDir(CONFIG.apiDir);
    ensureDir(CONFIG.assetsDir);

    // 检查现有的TypeScript配置文件是否存在
    if (!fs.existsSync(CONFIG.tsConfigPath)) {
      console.error(`错误: TypeScript配置文件不存在: ${CONFIG.tsConfigPath}`);
      process.exit(1);
    }

    createSearchJs();
    copyStylesheet();

    console.log('\n开始生成API文档...');

    const interfaceSuccess = generateInterfaceDocs();
    const atomicXSuccess = generateIndexDocs();

    if (interfaceSuccess && atomicXSuccess) {
      console.log('\n✓ 文档生成完成!');
      console.log(`- interface.html: ${path.join(CONFIG.apiDir, 'interface.html')}`);
      console.log(`- AtomicX.html: ${path.join(CONFIG.apiDir, 'AtomicX.html')}`);
    } else {
      console.error('\n✗ 部分文档生成失败，请检查日志');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ 文档生成过程中出错:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  } finally {
    console.log('\n清理临时文件...');
    if (fs.existsSync(CONFIG.tempDir)) {
      fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
    }
  }
}

// 执行主函数
generate();