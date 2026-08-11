export function formatProxy(proxyString) {
    if (!proxyString || typeof proxyString !== 'string' || !proxyString.trim()) {
        return undefined;
    }
    const parts = proxyString.trim().split(':');
    if (parts.length === 4) {
        const [ip, port, username, password] = parts;
        if (ip && port && username && password) {
            return `http://${username}:${password}@${ip}:${port}`;
        }
    }
    if (proxyString.startsWith('http://') || proxyString.startsWith('https://')) {
        return proxyString.trim();
    }
    return undefined;
}
