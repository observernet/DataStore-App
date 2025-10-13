import crypto from 'crypto-js';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const WS_BASE_URL  = import.meta.env.VITE_WS_BASE_URL;
const API_KEY      = import.meta.env.VITE_API_KEY;
const API_SECRET   = import.meta.env.VITE_API_SECRET;

function joinUrl(base, path) {
    const b = base?.replace(/\/+$/, '') || '';
    const p = (path || '').replace(/^\/+/, '');
    return `${b}/${p}`;
}

const comm = {
    websockets: {},

    GetNonce() {
        return Date.now();
    },
    GenerateHMAC(data, key) {
        const hmac = crypto.HmacSHA256(data, key);
        return hmac.toString(crypto.enc.Base64);
    },
    Base64UrlEncode(input) {
        const utf8Buffer = new TextEncoder().encode(input);
        let base64 = btoa(String.fromCharCode(...utf8Buffer));
        return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    },
    RequestGET(lang, trid, body) {
        return new Promise((resolve, reject) => {
            const queryStr = new URLSearchParams(body || {}).toString();
            let uri = trid;
            if (queryStr) uri = `${trid}?${queryStr}`;

            const nonce = this.GetNonce();
            const enddata = `${nonce}\n${API_KEY}\n${uri}`;
            const signature = this.GenerateHMAC(enddata, API_SECRET);

            const options = {
                method: 'get',
                url: joinUrl(API_BASE_URL, uri),
                headers: {
                    'Content-Type': 'application/json',
                    'X-DATASTORE-LANG': lang,
                    'X-DATASTORE-NONCE': nonce,
                    'X-DATASTORE-ACCESS': API_KEY,
                    'X-DATASTORE-SIGNATURE': signature
                }
            };

            axios(options).then((res) => {
                if (res.data.code === 'SUCCESS') {
                    resolve(res.data.data);
                } else {
                    reject({ type: 'server', error: res.data });
                }
            }).catch((err) => reject({ type: 'network', error: err }));
        });
    },
    RequestPOST(lang, trid, body) {
        return new Promise((resolve, reject) => {
            const postStr = JSON.stringify(body || {});
            const uri = trid;

            const nonce = this.GetNonce();
            const enddata = `${nonce}\n${API_KEY}\n${uri}`;
            const signature = this.GenerateHMAC(enddata, API_SECRET);

            const options = {
                method: 'post',
                url: joinUrl(API_BASE_URL, uri),
                headers: {
                    'Content-Type': 'application/json',
                    'X-DATASTORE-LANG': lang,
                    'X-DATASTORE-NONCE': nonce,
                    'X-DATASTORE-ACCESS': API_KEY,
                    'X-DATASTORE-SIGNATURE': signature
                },
                data: postStr
            };

            axios(options).then((res) => {
                if (res.data.code === 'SUCCESS') {
                    resolve(res.data.data);
                } else {
                    reject({ type: 'server', error: res.data });
                }
            }).catch((err) => reject({ type: 'network', error: err }));
        });
    },
    RequestPOSTwithFile(lang, trid, body, blob, filename) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('jsonBody', JSON.stringify(body || {}));
            formData.append('file', blob, filename);

            const uri = trid;

            const nonce = this.GetNonce();
            const enddata = `${nonce}\n${API_KEY}\n${uri}`;
            const signature = this.GenerateHMAC(enddata, API_SECRET);

            const options = {
                method: 'post',
                url: joinUrl(API_BASE_URL, uri),
                headers: {
                    'X-DATASTORE-LANG': lang,
                    'X-DATASTORE-NONCE': nonce,
                    'X-DATASTORE-ACCESS': API_KEY,
                    'X-DATASTORE-SIGNATURE': signature
                },
                data: formData
            };

            axios(options).then((res) => {
                if (res.data.code === 'SUCCESS') {
                    resolve(res.data.data);
                } else {
                    reject({ type: 'server', error: res.data });
                }
            }).catch((err) => reject({ type: 'network', error: err }));
        });
    },
    RequestFILE(lang, trid, body) {
        return new Promise((resolve, reject) => {
            const queryStr = new URLSearchParams(body || {}).toString();
            let uri = trid;
            if (queryStr) uri = `${trid}?${queryStr}`;

            const nonce = this.GetNonce();
            const enddata = `${nonce}\n${API_KEY}\n${uri}`;
            const signature = this.GenerateHMAC(enddata, API_SECRET);

            const options = {
                method: 'get',
                url: joinUrl(API_BASE_URL, uri),
                responseType: 'blob',
                headers: {
                    'X-DATASTORE-LANG': lang,
                    'X-DATASTORE-NONCE': nonce,
                    'X-DATASTORE-ACCESS': API_KEY,
                    'X-DATASTORE-SIGNATURE': signature
                }
            };

            axios(options).then(async (res) => {
                const contentType = res.headers['content-type'];
                if ( contentType && contentType.includes('application/json') ) {
                    const text = await res.data.text();
                    const jsonData = JSON.parse(text);
                    reject({ type: 'server', error: jsonData });
                } else {
                    resolve({ data: res.data, headers: res.headers });
                }
            }).catch((err) => reject({ type: 'network', error: err }));
        });
    },

    OpenWebSocket(lang, trid, body) {
        if ( this.websockets[trid] && this.websockets[trid].readyState === WebSocket.OPEN ) {
            return this.websockets[trid];
        }

        const queryStr = new URLSearchParams(body || {}).toString();
        const wsUrl = `${joinUrl(WS_BASE_URL, trid)}?lang=${encodeURIComponent(lang)}${queryStr ? `&${queryStr}` : ''}`;

        const socket = new WebSocket(wsUrl);
        this.websockets[trid] = socket;
        return socket;
    },
    SendMessage(trid, message) {
        const ws = this.websockets[trid];
        if ( ws && ws.readyState === WebSocket.OPEN ) {
            ws.send(JSON.stringify(message));
        } else {
            console.error(`WebSocket [${trid}] is not connected.`);
        }
    },
    CloseWebSocket(trid) {
        if ( this.websockets[trid] ) {
            this.websockets[trid].close();
            delete this.websockets[trid];
        }
    },
    CloseAllWebSockets() {
        Object.keys(this.websockets).forEach((trid) => {
            this.websockets[trid].close();
            delete this.websockets[trid];
        });
        console.log('All WebSockets closed.');
    }
};

export default comm;