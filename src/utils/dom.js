export function getUniqueSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    
    let path = [];
    
    //只取点击的那个元素的伪类选择器
    let fakeSelect = false
    while (element && element.nodeName.toLowerCase() !== 'html') {
        let selector = element.nodeName.toLowerCase();
        if (element.id) {
            selector += `#${element.id}`;
            path.unshift(selector);
            break;
        }
        // 过滤掉伪类选择器
        if (element.className) {
            // 处理类名，忽略伪类选择器
            const classNames = element.className.trim().split(/\s+/);
            const filteredClassNames = classNames.map(className => className.replace(/(:[^:]+)$/, '')); // 去掉伪类部分
            if (filteredClassNames.length) {
                selector += `.${filteredClassNames.join('.')}`;
                selector = selector.replace(/\.$/g, '');
            }
        }
        if (fakeSelect == false){
            const parent = element.parentElement;
            if (parent) {
                const children = Array.from(parent.children);
                const index = children.indexOf(element) + 1; // nth-child 是从1开始的
                selector += `:nth-child(${index})`;
            }
            fakeSelect = true
        }


        const attributes = element.attributes;
        for (let attr of attributes) {
            if (attr.name.startsWith('data-')) {
                selector += `[${attr.name}="${attr.value}"]`;
            }
        }

        path.unshift(selector);
        element = element.parentElement;
    }
    
    return path.join(" > ");
}
