const STORAGE_KEY = 'zedbee_state';
const AUTH_TOKEN_KEY = 'zedbee_auth_token';
const API_BASE = 'http://localhost:8000/api';

const defaultState = {
    user: null,
    config: {
        device: {
            type: '',
            manufacturer: ''
        },
        protocol: {
            mode: 'rtu',
            rtuRows: [],
            tcpRows: []
        },
        connections: {
            activeTab: 'http',
            wifi: {
                netType: 'dhcp',
                ssid: '',
                password: ''
            },
            mqtt: {
                platform: '',
                platformType: 'testing',
                deviceId: '',
                broker: { url: '', client: '', user: '', pass: '' },
                topics: { pub: '', sub: '', ack: '' }
            }
        }
    }
};

class Store {
    constructor() {
        this.state = this.load();
    }

    load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        const loaded = stored ? JSON.parse(stored) : null;
        const state = loaded || JSON.parse(JSON.stringify(defaultState));

        if (!state.config) state.config = defaultState.config;
        return state;
    }

    async fetchConfig() {
        // No-op: Config is stored in localStorage
    }

    async saveConfigToBackend() {
        // No-op: Config is stored in localStorage
    }

    save() {
        // Save locally only
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    async login(username, password) {
        // Hardcoded credentials for zedbee / 12345678
        if (username === 'zedbee' && password === '12345678') {
            this.state.user = { username: 'zedbee' };
            localStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token-for-compatibility');
            this.save();
            return true;
        }
        return false;
    }

    async signup(username, password) {
        // Signup is disabled or simulated as success for the demo user
        if (username === 'zedbee') {
            return { success: false, message: 'User already exists' };
        }
        return { success: true, message: 'Signup simulated success' };
    }

    logout() {
        this.state.user = null;
        this.state.config = JSON.parse(JSON.stringify(defaultState.config));
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this.save();
    }

    async verifySession() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token === 'dummy-token-for-compatibility') {
            this.state.user = { username: 'zedbee' };
            return true;
        }
        this.logout();
        return false;
    }

    async updatePassword(currentPassword, newPassword) {
        // Simulated success for demo purposes
        return true;
    }

    async resetPassword(username, newPassword) {
        // Simulated success for demo purposes
        if (username === 'zedbee') return true;
        return false;
    }


    updateDevice(data) {
        this.state.config.device = { ...this.state.config.device, ...data };
        this.save();
    }

    updateProtocol(mode, rows) {
        this.state.config.protocol.mode = mode;
        if (mode === 'rtu') {
            this.state.config.protocol.rtuRows = rows;
        } else {
            this.state.config.protocol.tcpRows = rows;
        }
        this.save();
    }

    updateConnectionsTab(tab) {
        this.state.config.connections.activeTab = tab;
        this.save();
    }

    updateWiFi(data) {
        this.state.config.connections.wifi = { ...this.state.config.connections.wifi, ...data };
        this.save();
    }

    updateMQTT(section, data) {
        if (!this.state.config.connections.mqtt) {
            this.state.config.connections.mqtt = {
                platform: '', platformType: '', deviceId: '',
                broker: { url: '', client: '', user: '', pass: '' },
                topics: { pub: '', sub: '', ack: '' }
            };
        }

        if (section === 'root') {
            this.state.config.connections.mqtt = { ...this.state.config.connections.mqtt, ...data };
        } else {
            if (!this.state.config.connections.mqtt[section]) {
                this.state.config.connections.mqtt[section] = {};
            }
            this.state.config.connections.mqtt[section] = { ...this.state.config.connections.mqtt[section], ...data };
        }
        this.save();
    }

    getSummary(section) {

        switch (section) {
            case 'device':
                const typeMap = {
                    energy: 'Energy Meter',
                    flow: 'Flow Meter'
                };
                const displayType = typeMap[this.state.config.device.type] || this.state.config.device.type;
                return `
                    <div class="summary-grid" style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px;">
                        <div><strong>Type:</strong> ${displayType}</div>
                        <div><strong>Manufacturer:</strong> ${this.state.config.device.manufacturer}</div>
                    </div>`;
            case 'protocol':
                if (this.state.config.protocol.mode === 'rtu') {
                    let html = `<div style="margin-bottom:8px"><strong>Mode:</strong> RTU (Serial)</div><table class="summary-table"><thead><tr><th>#</th><th>Slave ID</th><th>Baud Rate</th><th>Parity</th><th>Data Bits</th><th>Stop Bits</th><th>Func Code</th><th>Address</th><th>Qty</th></tr></thead><tbody>`;
                    if (this.state.config.protocol.rtuRows && this.state.config.protocol.rtuRows.length > 0) {
                        this.state.config.protocol.rtuRows.forEach((row, index) => {
                            html += `<tr><td>${index + 1}</td><td>${row.slaveId}</td><td>${row.baud}</td><td>${row.parity}</td><td>${row.dataBits}</td><td>${row.stopBits}</td><td>${row.funcCode}</td><td>${row.slaveAddr}</td><td>${row.quantity}</td></tr>`;
                        });
                    } else { html += '<tr><td colspan="9" style="text-align:center; opacity:0.7">No RTU rows configured</td></tr>'; }
                    html += '</tbody></table>';
                    return html;
                } else {
                    let html = `<div style="margin-bottom:8px"><strong>Mode:</strong> TCP (Network)</div><table class="summary-table"><thead><tr><th>#</th><th>IP Address</th><th>Port</th><th>Gateway</th><th>Func Code</th><th>Slave ID</th><th>Address</th><th>Qty</th></tr></thead><tbody>`;
                    if (this.state.config.protocol.tcpRows && this.state.config.protocol.tcpRows.length > 0) {
                        this.state.config.protocol.tcpRows.forEach((row, index) => {
                            html += `<tr><td>${index + 1}</td><td>${row.ip}</td><td>${row.port}</td><td>${row.gateway || '-'}</td><td>${row.funcCode}</td><td>${row.slaveId}</td><td>${row.slaveAddr}</td><td>${row.quantity}</td></tr>`;
                        });
                    } else { html += '<tr><td colspan="8" style="text-align:center; opacity:0.7">No TCP connections configured</td></tr>'; }
                    html += '</tbody></table>';
                    return html;
                }
            case 'connections':
                const active = this.state.config.connections.activeTab;
                if (active === 'http') {
                    return `<div><h4 style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; color:hsl(var(--ue-primary));">HTTP Configuration</h4><p style="opacity:0.7">No HTTP configuration saved.</p></div>`;
                } else {
                    const mqtt = this.state.config.connections.mqtt;
                    return `<div><h4 style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; color:hsl(var(--ue-success));">MQTT Configuration</h4><div style="display:grid; grid-template-columns: auto 1fr; gap: 8px 16px;"><div><strong>Platform:</strong></div> <div>${mqtt.platform || '-'}</div><div><strong>Environment:</strong></div> <div>${mqtt.platformType || '-'}</div><div><strong>Broker:</strong></div> <div>${mqtt.broker.url || '-'}</div><div><strong>Username:</strong></div> <div>${mqtt.broker.user || '-'}</div><div><strong>Device ID:</strong></div> <div>${mqtt.deviceId || '-'}</div></div><h4 style="margin-top:16px; margin-bottom:8px; font-size:0.9rem;">Topics</h4><ul style="list-style:none; padding-left:0; opacity:0.9;"><li><span style="opacity:0.6">Publish:</span> ${mqtt.topics.pub || '-'}</li><li><span style="opacity:0.6">Subscribe:</span> ${mqtt.topics.sub || '-'}</li><li><span style="opacity:0.6">Ack:</span> ${mqtt.topics.ack || '-'}</li></ul></div>`;
                }
            default: return '';
        }
    }
}

window.store = new Store();
