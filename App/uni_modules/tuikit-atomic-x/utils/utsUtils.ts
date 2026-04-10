/**
 * 安全的JSON解析函数
 * @param jsonString JSON字符串
 * @param defaultValue 解析失败时的默认值
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    if (typeof jsonString !== 'string') {
        return jsonString;
    }
    let result;
    try {
        result = JSON.parse(jsonString);
    } catch (error) {
        result = defaultValue;
    }
    return result;
}