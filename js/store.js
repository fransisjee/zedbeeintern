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
        if (!this.state.user) return;
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const res = await fetch(`${API_BASE}/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const body = await res.json();
                if (body.data && Object.keys(body.data).length > 0) {
                    this.state.config = { ...defaultState.config, ...body.data };

                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
                }
            }
        } catch (err) {
            console.error('Failed to fetch config:', err);
        }
    }

    async saveConfigToBackend() {
        if (!this.state.user) return;
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            await fetch(`${API_BASE}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: this.state.config })
            });
        } catch (err) {
            console.error('Failed to save config to backend:', err);
        }
    }

    save() {
        // Save locally
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        // Save to cloud (fire and forget)
        this.saveConfigToBackend();
    }



    async login(username, password) {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) return false;

            const data = await res.json();
            this.state.user = { username: data.username };

            await this.fetchConfig();

            this.save();
            return true;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    }

    async signup(username, password) {
        try {
            const res = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const data = await res.json();

                return { success: false, message: data.detail || data.message || 'Signup failed' };
            }

            return { success: true };
        } catch (err) {
            console.error('Signup error:', err);
            return { success: false, message: 'Could not connect to server. Ensure backend is running.' };
        }
    }

    logout() {
        this.state.user = null;

        this.state.config = JSON.parse(JSON.stringify(defaultState.config));
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this.save();
    }

    async verifySession() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            this.logout();
            return false;
        }

        try {
            const res = await fetch(`${API_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                this.state.user = { username: data.username };
                await this.fetchConfig();
                this.save();
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (err) {
            this.logout();
            return false;
        }
    }

    async updatePassword(currentPassword, newPassword) {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        try {
            const res = await fetch(`${API_BASE}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            return res.ok;
        } catch (err) {
            return false;
        }
    }

    async resetPassword(username, newPassword) {
        try {
            const res = await fetch(`${API_BASE}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newPassword })
            });
            return res.ok;
        } catch (err) {
            return false;
        }
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
