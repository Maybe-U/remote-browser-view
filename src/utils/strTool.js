export function isJSONString(variable) {
    if (typeof variable !== 'string') {
        return false;
    }
    try {
        const parsed = JSON.parse(variable);
        return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
        return false;
    }
}

export function isJSONObject(variable) {
    return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}