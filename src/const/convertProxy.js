export function formatProxy(proxyString) {
    const [ip, port, username, password] = proxyString.split(':');
    if (!ip || !port || !username || !password) {
        throw new Error('Proxy string không hợp lệ. Định dạng phải là IP:PORT:USERNAME:PASSWORD');
    }
    return `http://${username}:${password}@${ip}:${port}`;
}
