const fs = require('fs');
const path = require('path');

// 读取HTML文件内容
function readHtmlFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

// 读取JSON文件内容
function readJsonFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

// 保存JSON文件
function saveJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`JSON文件已保存到: ${filePath}`);
}

// 清理HTML标签和特殊字符的工具函数
function cleanText(text) {
    if (!text) return '';
    return text.trim()
        .replace(/<[^>]+>/g, '') // 移除HTML标签
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ') // 规范化空格
        .trim();
}

// 从HTML中提取所有模块的专业描述
function extractModuleDescriptions(htmlContent) {
    const descriptions = {};

    // 提取所有 module-description 部分
    const descRegex = /<section id="module-(\w+)">[\s\S]*?<div class="module-description">([\s\S]*?)<\/div>/g;
    let descMatch;

    while ((descMatch = descRegex.exec(htmlContent)) !== null) {
        const moduleName = descMatch[1];
        const descHtml = descMatch[2];

        // 提取纯文本描述 - 只提取段落内容
        let descText = cleanText(descHtml);

        // 如果描述过长，提取核心功能部分
        if (descText.length > 200) {
            // 尝试提取"核心功能"部分作为简介
            const coreFeatureMatch = descHtml.match(/核心功能：<\/strong>(.*?)<\/p>/);
            if (coreFeatureMatch) {
                descText = cleanText(coreFeatureMatch[1]).substring(0, 200);
            }
        }

        descriptions[moduleName] = descText;
    }

    return descriptions;
}

// 从HTML中提取所有模块的响应式数据信息
function extractReactiveData(htmlContent) {
    const modules = [];

    // 从HTML中提取所有 data-* section，获取模块的响应式数据
    const dataModuleRegex = /<section id="data-(\w+)">[\s\S]*?<h3>响应式数据<\/h3>[\s\S]*?<\/section>/g;
    let dataModuleMatch;

    while ((dataModuleMatch = dataModuleRegex.exec(htmlContent)) !== null) {
        const moduleName = dataModuleMatch[1];
        const sectionContent = dataModuleMatch[0];

        const dataItems = [];

        // 从section中提取所有 data-item
        const dataItemRegex = /<div class="data-item" id="(\w+)">.*?<h4>(\w+)<\/h4>.*?<div class="api-description">(.*?)<\/div>/gs;
        let dataItemMatch;

        while ((dataItemMatch = dataItemRegex.exec(sectionContent)) !== null) {
            const dataId = dataItemMatch[1];
            const dataName = dataItemMatch[2];
            const description = cleanText(dataItemMatch[3]);

            dataItems.push({
                name: dataName,
                description: description || `${dataName}数据`
            });
        }

        if (dataItems.length > 0) {
            modules.push({
                id: moduleName,
                name: moduleName,
                data: dataItems
            });
        }
    }

    return modules;
}

// 从HTML中提取所有模块和方法信息
function extractModules(htmlContent) {
    const modules = [];

    // 从目录中提取所有模块名称和其下的方法
    const moduleRegex = /<li><a href="#module-(\w+)">(\w+)<\/a>\s*<ul>([\s\S]*?)<\/ul>/g;
    let moduleMatch;

    while ((moduleMatch = moduleRegex.exec(htmlContent)) !== null) {
        const moduleId = moduleMatch[1];
        const moduleName = moduleMatch[2];
        const methodsListHtml = moduleMatch[3];

        const methods = [];

        // 从目录中提取该模块下的所有方法名
        const methodNameRegex = /<li><a href="#(\w+)">(\w+)<\/a><\/li>/g;
        let methodNameMatch;

        while ((methodNameMatch = methodNameRegex.exec(methodsListHtml)) !== null) {
            const methodId = methodNameMatch[1];
            const methodName = methodNameMatch[2];

            // 尝试从HTML中查找该方法的详细信息以获取描述
            // 首先尝试直接在section中查找概述或描述
            let methodDescription = '';

            // 尝试多种可能的描述提取方式
            const descriptionRegexes = [
                // 查找section中的第一个p标签内容作为描述
                new RegExp(`<section id="${methodId}">.*?<p>(.*?)<\/p>`, 'is'),
                // 查找section中的description相关class
                new RegExp(`<section id="${methodId}">.*?<div[^>]*class=["']description["'][^>]*>(.*?)<\/div>`, 'is'),
                // 查找section中的api-description相关class
                new RegExp(`<section id="${methodId}">.*?<div[^>]*class=["']api-description["'][^>]*>(.*?)<\/div>`, 'is'),
                // 查找方法名称后面的描述文本
                new RegExp(`<h3[^>]*id="${methodId}">[^<]*<\/h3>.*?<p>(.*?)<\/p>`, 'is')
            ];

            for (const regex of descriptionRegexes) {
                const match = regex.exec(htmlContent);
                if (match && match[1]) {
                    methodDescription = match[1].trim()
                        .replace(/<[^>]+>/g, '') // 移除HTML标签
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&apos;/g, "'")
                        .replace(/\s+/g, ' ') // 规范化空格
                        .trim();
                    break;
                }
            }

            // 如果仍然没有描述，根据方法名称生成一个默认描述
            if (!methodDescription) {
                // 根据方法名生成简单描述
                if (methodName.startsWith('add')) {
                    methodDescription = `添加${methodName.slice(3)}`;
                } else if (methodName.startsWith('remove')) {
                    methodDescription = `移除${methodName.slice(6)}`;
                } else if (methodName.startsWith('set')) {
                    methodDescription = `设置${methodName.slice(3)}`;
                } else if (methodName.startsWith('get')) {
                    methodDescription = `获取${methodName.slice(3)}`;
                } else if (methodName.includes('Live')) {
                    methodDescription = `${methodName.replace(/([A-Z])/g, ' $1').trim()}相关方法`;
                } else if (methodName.includes('Seat')) {
                    methodDescription = `${methodName.replace(/([A-Z])/g, ' $1').trim()}相关方法`;
                } else if (methodName.includes('CoGuest')) {
                    methodDescription = `${methodName.replace(/([A-Z])/g, ' $1').trim()}相关方法`;
                } else if (methodName.includes('Audio')) {
                    methodDescription = `${methodName.replace(/([A-Z])/g, ' $1').trim()}相关方法`;
                } else {
                    methodDescription = `${methodName}方法`;
                }
            }

            methods.push({
                name: methodName,
                description: methodDescription
            });
        }

        modules.push({
            id: moduleId,
            name: moduleName,
            methods: methods
        });
    }

    return modules;
}

// 为模块生成JSON结构
function generateModuleJson(module, description, existingContent) {
    const moduleContent = [];

    // 不生成h2标题，因为模块名字只在最开始出现一次
    // 只生成h3标题 "接口函数"
    const h3Node = {
        type: "h3",
        children: [{
            text: "接口函数"
        }],
        id: generateId()
    };
    moduleContent.push(h3Node);

    // 生成表格
    const tableRows = module.methods.map(method => {
        // 生成链接文本
        const linkTextP = {
            type: "p",
            children: [
                { text: "" },
                {
                    type: "ref",
                    props: {
                        type: "link",
                        url: `https://liteav.sdk.qcloud.com/doc/product/tuikit/atomic-x/uni-app/zh/v1.0/api/index.html#${method.name}`
                    },
                    children: [{ text: method.name }],
                    id: generateId()
                },
                { text: "" }
            ],
            id: generateId()
        };

        // 生成描述文本
        const descriptionP = {
            type: "p",
            children: [{ text: method.description }],
            id: generateId()
        };

        return {
            type: "row",
            children: [
                {
                    type: "cell",
                    children: [linkTextP],
                    rowSpan: 1,
                    colSpan: 1,
                    id: generateId()
                },
                {
                    type: "cell",
                    children: [descriptionP],
                    rowSpan: 1,
                    colSpan: 1,
                    id: generateId()
                }
            ],
            id: generateId()
        };
    });

    const tableNode = {
        type: "table",
        children: tableRows,
        widths: [298, 566],
        widthMode: "absolute",
        id: generateId()
    };
    moduleContent.push(tableNode);

    return moduleContent;
}

// 为响应式数据生成JSON结构
function generateReactiveDataJson(module, existingContent) {
    const moduleContent = [];

    // 不生成h2标题，因为模块名字只在最开始出现一次
    // 只生成h3标题 "响应式数据"
    const h3Node = {
        type: "h3",
        children: [{
            text: "响应式数据"
        }],
        id: generateId()
    };
    moduleContent.push(h3Node);

    // 生成表格
    const tableRows = module.data.map(item => {
        // 生成链接文本
        const linkTextP = {
            type: "p",
            children: [
                { text: "" },
                {
                    type: "ref",
                    props: {
                        type: "link",
                        url: `https://liteav.sdk.qcloud.com/doc/product/tuikit/atomic-x/uni-app/zh/v1.0/api/index.html#${item.name}`
                    },
                    children: [{ text: item.name }],
                    id: generateId()
                },
                { text: "" }
            ],
            id: generateId()
        };

        // 生成描述文本
        const descriptionP = {
            type: "p",
            children: [{ text: item.description }],
            id: generateId()
        };

        return {
            type: "row",
            children: [
                {
                    type: "cell",
                    children: [linkTextP],
                    rowSpan: 1,
                    colSpan: 1,
                    id: generateId()
                },
                {
                    type: "cell",
                    children: [descriptionP],
                    rowSpan: 1,
                    colSpan: 1,
                    id: generateId()
                }
            ],
            id: generateId()
        };
    });

    const tableNode = {
        type: "table",
        children: tableRows,
        widths: [298, 566],
        widthMode: "absolute",
        id: generateId()
    };
    moduleContent.push(tableNode);

    return moduleContent;
}

// 生成唯一ID
function generateId() {
    return Math.random().toString(36).substr(2, 9) + '_' + Math.random().toString(36).substr(2, 9);
}

// 查找模块在JSON中的位置和表格位置
function findModulePosition(jsonContent, moduleName) {
    for (let i = 0; i < jsonContent.content.length; i++) {
        if (jsonContent.content[i].type === 'h2' && jsonContent.content[i].children[0].text === moduleName) {
            // 找到模块标题后，查找其对应的表格
            let tableIndex = -1;
            for (let j = i + 1; j < jsonContent.content.length; j++) {
                if (jsonContent.content[j].type === 'table') {
                    tableIndex = j;
                    break;
                }
                // 如果遇到下一个h2，则停止查找
                if (jsonContent.content[j].type === 'h2') {
                    break;
                }
            }
            return {
                exists: true,
                titleIndex: i,
                tableIndex: tableIndex,
                tableHasContent: tableIndex >= 0 && jsonContent.content[tableIndex].children && jsonContent.content[tableIndex].children.length > 0
            };
        }
    }
    return { exists: false };
}

// 为现有的接口函数表格添加h3标题（如果不存在的话）
function addH3TitleBeforeTable(jsonContent, modulePosition, title) {
    // 检查表格前面是否已有相同的h3标题
    // 查找最接近表格的h3标题
    let hasTitle = false;
    for (let i = modulePosition.tableIndex - 1; i >= 0; i--) {
        const item = jsonContent.content[i];
        // 如果遇到另一个表格或h2，停止搜索
        if (item.type === 'table' || item.type === 'h2') {
            break;
        }
        // 如果找到了要找的h3标题
        if (item.type === 'h3' && item.children && item.children[0].text === title) {
            hasTitle = true;
            break;
        }
    }

    // 如果没有找到h3标题，添加一个
    if (!hasTitle) {
        const h3Node = {
            type: "h3",
            children: [{
                text: title
            }],
            id: generateId()
        };
        jsonContent.content.splice(modulePosition.tableIndex, 0, h3Node);
        return true;
    }

    return false;
}

// 检查模块的h2标题后是否已有描述
function hasDescriptionAfterH2(jsonContent, h2Index) {
    if (h2Index + 1 < jsonContent.content.length) {
        const nextItem = jsonContent.content[h2Index + 1];
        if (nextItem.type === 'p' && nextItem.children && nextItem.children.length > 0) {
            const text = nextItem.children[0].text;
            // 检查是否是模块描述（包含"核心功能"的p标签）
            if (text && text.includes('核心功能')) {
                return true;
            }
        }
    }
    return false;
}

// 查找响应式数据部分的插入位置
function findReactiveDataPosition(jsonContent, moduleName) {
    // 先找到模块的h2标题
    let moduleH2Index = -1;
    let nextH2Index = jsonContent.content.length;

    for (let i = 0; i < jsonContent.content.length; i++) {
        if (jsonContent.content[i].type === 'h2' && jsonContent.content[i].children[0].text === moduleName) {
            moduleH2Index = i;
            break;
        }
    }

    if (moduleH2Index === -1) {
        return { exists: false, insertIndex: -1 };
    }

    // 找到下一个h2或末尾
    for (let i = moduleH2Index + 1; i < jsonContent.content.length; i++) {
        if (jsonContent.content[i].type === 'h2') {
            nextH2Index = i;
            break;
        }
    }

    // 在h2和下一个h2之间查找是否已有响应式数据部分
    let reactiveDataH3Index = -1;
    let firstTableIndex = -1;
    let reactiveDataTableCount = 0;

    for (let i = moduleH2Index + 1; i < nextH2Index; i++) {
        const item = jsonContent.content[i];

        // 查找"响应式数据" h3标题
        if (item.type === 'h3' && item.children && item.children[0].text === '响应式数据') {
            if (reactiveDataH3Index === -1) {
                reactiveDataH3Index = i;
            }
        }

        // 查找表格
        if (item.type === 'table') {
            if (firstTableIndex === -1) {
                firstTableIndex = i;
            }
            // 计算响应式数据后的表格数量
            if (reactiveDataH3Index >= 0 && i > reactiveDataH3Index) {
                reactiveDataTableCount++;
            }
        }
    }

    // 如果找到了"响应式数据" h3和紧跟其后的表格，说明已经存在响应式数据部分
    if (reactiveDataH3Index >= 0 && reactiveDataTableCount >= 1) {
        return { exists: true, insertIndex: -1 };  // exists: true 表示已存在，不需要添加
    }

    // 如果没有找到响应式数据部分，在第一个表格前插入
    if (firstTableIndex >= 0) {
        return { exists: false, insertIndex: firstTableIndex };
    }

    // 如果没有表格，就在末尾插入（不太可能发生）
    return { exists: false, insertIndex: nextH2Index };
}

// 查找模块的接口函数表格位置（通常是最后一个表格）
function findModuleInterfaceFunctionTablePosition(jsonContent, moduleName) {
    let moduleH2Index = -1;
    let nextH2Index = jsonContent.content.length;

    // 找到该模块的最后一个h2标题（原始的）
    for (let i = 0; i < jsonContent.content.length; i++) {
        if (jsonContent.content[i].type === 'h2' && jsonContent.content[i].children[0].text === moduleName) {
            moduleH2Index = i;
        }
    }

    if (moduleH2Index === -1) {
        return { exists: false, tableIndex: -1 };
    }

    // 找到下一个不同的h2标题位置
    for (let i = moduleH2Index + 1; i < jsonContent.content.length; i++) {
        if (jsonContent.content[i].type === 'h2' && jsonContent.content[i].children[0].text !== moduleName) {
            nextH2Index = i;
            break;
        }
    }

    // 在该模块范围内查找最后一个表格
    let lastTableIndex = -1;
    for (let i = moduleH2Index + 1; i < nextH2Index; i++) {
        if (jsonContent.content[i].type === 'table') {
            lastTableIndex = i;
        }
    }

    if (lastTableIndex === -1) {
        return { exists: false, tableIndex: -1 };
    }

    return { exists: true, tableIndex: lastTableIndex };
}

// 从HTML中提取概述说明内容
function extractOverview(htmlContent) {
    // 尝试从overview部分提取概述内容
    const overviewRegex = /<section id="overview">.*?<p>(.*?)<\/p>/is;
    const match = overviewRegex.exec(htmlContent);
    if (match && match[1]) {
        return cleanText(match[1]);
    }

    // 如果找不到overview部分，返回默认的概述内容
    return "atomicx-core sdk 是腾讯云最新推出的面向即时通信、音视频通话、视频直播、语聊房等场景的全新一代基于响应式的 API，您可以非常快速的在基于这组 API 构建自己的 UI 页面，它支持房间管理、屏幕分享、成员管理、麦位控制、基础美颜等丰富功能，同时基于 TRTC SDK，能够提供超低延时、高品质的音视频体验，本页面包含 atomicx-core sdk 的所有API接口，按功能模块分类展示。";
}

// 主函数
function main() {
    // 使用相对路径，确保脚本在不同环境下都能正常工作
    const htmlPath = path.resolve(__dirname, './output/api/index.html');
    const jsonPath = path.resolve(__dirname, './output/uni-app.json');

    try {
        // 读取文件
        const htmlContent = readHtmlFile(htmlPath);
        const jsonContent = readJsonFile(jsonPath);

        // 提取模块描述
        const moduleDescriptions = extractModuleDescriptions(htmlContent);
        console.log(`总共提取到 ${Object.keys(moduleDescriptions).length} 个模块的专业描述`);

        // 提取模块信息（接口函数）
        const modules = extractModules(htmlContent);
        console.log(`总共提取到 ${modules.length} 个模块（接口函数）`);

        // 提取响应式数据信息
        const reactiveDataModules = extractReactiveData(htmlContent);
        console.log(`总共提取到 ${reactiveDataModules.length} 个模块（响应式数据）`);

        // 提取并添加概述说明内容
        const overviewText = extractOverview(htmlContent);

        // 检查是否已经有概述内容（非空的p标签）
        let hasOverview = false;
        for (let i = 0; i < jsonContent.content.length; i++) {
            const item = jsonContent.content[i];
            if (item.type === 'p' &&
                item.children &&
                item.children.length > 0 &&
                item.children[0].text &&
                item.children[0].text.trim().length > 0) {
                hasOverview = true;
                // 更新现有概述内容
                item.children[0].text = overviewText;
                console.log('已更新概述说明内容');
                break;
            }
        }

        // 如果没有概述内容，在开头添加
        if (!hasOverview) {
            const overviewNode = {
                type: "p",
                children: [{
                    text: overviewText
                }],
                id: generateId()
            };
            // 在开头添加概述内容
            jsonContent.content.unshift(overviewNode);
            console.log('已添加概述说明内容');
        }

        // 首先处理响应式数据（需要在接口函数之前插入）
        let dataAddedCount = 0;
        let dataUpdatedCount = 0;
        let descriptionAddedCount = 0;
        let skippedReactiveDataCount = 0;

        // 记录已添加描述的模块，避免重复添加
        const descriptionAddedModules = new Set();

        reactiveDataModules.forEach(dataModule => {
            const dataPosition = findReactiveDataPosition(jsonContent, dataModule.name);

            if (dataPosition.insertIndex >= 0 && dataModule.data.length > 0) {
                // 如果模块还没有添加描述，先检查是否已经存在
                if (!descriptionAddedModules.has(dataModule.name)) {
                    // 找到模块的h2标题位置，检查是否已有描述
                    let h2Index = -1;
                    for (let i = 0; i < jsonContent.content.length; i++) {
                        if (jsonContent.content[i].type === 'h2' &&
                            jsonContent.content[i].children[0].text === dataModule.name &&
                            jsonContent.content[i].nodeId !== dataModule.name) {  // 找第一个h2（原始的）
                            h2Index = i;
                            break;
                        }
                    }

                    // 如果没有找到原始h2，继续查找
                    if (h2Index === -1) {
                        for (let i = 0; i < jsonContent.content.length; i++) {
                            if (jsonContent.content[i].type === 'h2' &&
                                jsonContent.content[i].children[0].text === dataModule.name) {
                                h2Index = i;
                                break;
                            }
                        }
                    }

                    // 如果h2后面没有描述，则添加
                    if (h2Index >= 0 && !hasDescriptionAfterH2(jsonContent, h2Index)) {
                        const moduleDesc = moduleDescriptions[dataModule.name] || '';
                        if (moduleDesc) {
                            const descNode = {
                                type: "p",
                                children: [{
                                    text: moduleDesc
                                }],
                                id: generateId()
                            };
                            // 在h2标题后添加描述
                            jsonContent.content.splice(h2Index + 1, 0, descNode);
                            descriptionAddedModules.add(dataModule.name);
                            descriptionAddedCount++;
                            // 描述添加后，需要调整后续插入位置
                            dataPosition.insertIndex++;
                        }
                    } else if (h2Index >= 0) {
                        // 描述已经存在，标记为已添加
                        descriptionAddedModules.add(dataModule.name);
                    }
                }

                // 生成响应式数据JSON（不包含h2，只包含表格）
                const dataJson = generateReactiveDataJson(dataModule, jsonContent);
                // 在指定位置插入响应式数据
                jsonContent.content.splice(dataPosition.insertIndex, 0, ...dataJson);
                dataAddedCount++;
                console.log(`已添加${dataModule.name}模块的响应式数据（${dataModule.data.length}项）`);
            } else if (dataPosition.insertIndex === -1 && dataPosition.exists) {
                console.log(`${dataModule.name}模块的响应式数据已存在，跳过添加`);
                skippedReactiveDataCount++;
            }
        });

        // 为每个模块生成JSON结构并添加到现有内容中
        let addedCount = 0;
        let updatedCount = 0;
        let descriptionUpdatedCount = 0;

        modules.forEach(module => {
            const modulePosition = findModulePosition(jsonContent, module.name);

            if (!modulePosition.exists) {
                // 模块不存在，添加新模块
                const moduleDesc = moduleDescriptions[module.name] || '';
                console.log(`添加新模块: ${module.name} (${module.methods.length}个接口函数)`);
                const moduleJson = generateModuleJson(module, moduleDesc, jsonContent);
                jsonContent.content.push(...moduleJson);
                addedCount++;
            } else if (modulePosition.tableIndex >= 0) {
                // 检查表格是否需要更新（空表格或缺少描述）
                let needsUpdate = false;
                const existingTable = jsonContent.content[modulePosition.tableIndex];

                if (!modulePosition.tableHasContent && module.methods.length > 0) {
                    needsUpdate = true;
                } else if (existingTable.children && existingTable.children.length > 0) {
                    // 检查是否有方法缺少描述
                    for (let i = 0; i < existingTable.children.length; i++) {
                        const row = existingTable.children[i];
                        if (row.children && row.children.length > 1) {
                            const descCell = row.children[1];
                            if (descCell.children && descCell.children.length > 0) {
                                const descP = descCell.children[0];
                                if (descP.children && descP.children.length > 0) {
                                    const descText = descP.children[0].text;
                                    if (!descText || descText.trim() === '') {
                                        needsUpdate = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                if (needsUpdate) {
                    const tableRows = module.methods.map(method => {
                        // 生成链接文本
                        const linkTextP = {
                            type: "p",
                            children: [
                                { text: "" },
                                {
                                    type: "ref",
                                    props: {
                                        type: "link",
                                        url: `https://liteav.sdk.qcloud.com/doc/product/tuikit/atomic-x/uni-app/zh/v1.0/api/index.html#${method.name}`
                                    },
                                    children: [{ text: method.name }],
                                    id: generateId()
                                },
                                { text: "" }
                            ],
                            id: generateId()
                        };

                        // 生成描述文本
                        const descriptionP = {
                            type: "p",
                            children: [{ text: method.description }],
                            id: generateId()
                        };

                        return {
                            type: "row",
                            children: [
                                {
                                    type: "cell",
                                    children: [linkTextP],
                                    rowSpan: 1,
                                    colSpan: 1,
                                    id: generateId()
                                },
                                {
                                    type: "cell",
                                    children: [descriptionP],
                                    rowSpan: 1,
                                    colSpan: 1,
                                    id: generateId()
                                }
                            ],
                            id: generateId()
                        };
                    });

                    // 更新表格内容
                    jsonContent.content[modulePosition.tableIndex].children = tableRows;
                    updatedCount++;
                    descriptionUpdatedCount += module.methods.length;
                    console.log(`已更新${module.name}模块中的${module.methods.length}个接口函数描述`);
                }
            } else {
                console.log(`模块已存在且有内容: ${module.name}`);
            }
        });

        // 为现有的表格添加h3标题（如果缺少的话）
        let h3AddedCount = 0;
        modules.forEach(module => {
            const secondTablePosition = findModuleInterfaceFunctionTablePosition(jsonContent, module.name);
            if (secondTablePosition.exists && secondTablePosition.tableIndex >= 0) {
                // 为接口函数表格添加h3标题
                if (addH3TitleBeforeTable(jsonContent, secondTablePosition, '接口函数')) {
                    h3AddedCount++;
                }
            }
        });

        // 保存更新后的JSON文件
        saveJsonFile(jsonPath, jsonContent);

        // 移除重复的h2标题（nodeId与模块名相同的那些，这些是响应式数据部分的h2）
        // 应该只保留第一个h2
        let duplicateH2RemovedCount = 0;
        for (let i = jsonContent.content.length - 1; i >= 0; i--) {
            const item = jsonContent.content[i];
            if (item.type === 'h2' && item.nodeId && typeof item.nodeId === 'string') {
                // 如果这个h2的text与nodeId相同，说明这是后续部分的h2
                // 需要检查是否已经有另一个相同名称的h2了
                let firstH2Index = -1;
                for (let j = 0; j < i; j++) {
                    if (jsonContent.content[j].type === 'h2' &&
                        jsonContent.content[j].children[0].text === item.children[0].text) {
                        firstH2Index = j;
                        break;
                    }
                }

                // 如果找到了更早的相同名称的h2，移除这个重复的
                if (firstH2Index >= 0 && firstH2Index !== i) {
                    jsonContent.content.splice(i, 1);
                    duplicateH2RemovedCount++;
                }
            }
        }

        // 移除重复的"响应式数据"部分（保留第一个）
        let duplicateReactiveDataRemovedCount = 0;
        const reactiveDataModuleSet = new Set();
        for (let i = jsonContent.content.length - 1; i >= 0; i--) {
            const item = jsonContent.content[i];

            // 查找"响应式数据" h3
            if (item.type === 'h3' && item.children && item.children[0].text === '响应式数据') {
                // 找到前面最近的h2
                let moduleName = null;
                for (let j = i - 1; j >= 0; j--) {
                    if (jsonContent.content[j].type === 'h2' && jsonContent.content[j].children) {
                        moduleName = jsonContent.content[j].children[0].text;
                        break;
                    }
                }

                if (moduleName) {
                    if (reactiveDataModuleSet.has(moduleName)) {
                        // 这是重复的响应式数据部分，删除这个h3和之后的table
                        jsonContent.content.splice(i, 1);  // 删除h3

                        // 删除之后的table（如果存在）
                        if (i < jsonContent.content.length && jsonContent.content[i].type === 'table') {
                            jsonContent.content.splice(i, 1);  // 删除table
                        }

                        duplicateReactiveDataRemovedCount++;
                    } else {
                        reactiveDataModuleSet.add(moduleName);
                    }
                }
            }
        }

        // 保存最后的JSON文件
        saveJsonFile(jsonPath, jsonContent);

        if (descriptionUpdatedCount > 0) {
            console.log(`成功补全了 ${descriptionUpdatedCount} 个接口函数的文字描述`);
        }
        if (skippedReactiveDataCount > 0) {
            console.log(`跳过了 ${skippedReactiveDataCount} 个响应式数据模块的重复添加`);
        }

    } catch (error) {
        console.error('错误:', error.message);
    }
}

// 运行主函数
main();