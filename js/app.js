
// =========================================
// Router Logic
// =========================================
class Router {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-links li');
        this.views = document.querySelectorAll('.view');
        this.nav = document.getElementById('main-nav');

        // Handle Nav Clicks
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.target;
                this.navigate(target);
            });
        });
    }

    navigate(viewId) {
        // Auth Guard
        if (!store.state.user && !['login', 'reset-password', 'signup'].includes(viewId)) {
            this.showView('login');
            return;
        }

        // Redirect Login to Home if authenticated
        if (store.state.user && viewId === 'login') {
            this.navigate('home');
            return;
        }

        this.showView(viewId);
        if (['login', 'reset-password', 'signup'].includes(viewId)) {
            this.nav.classList.add('hidden');
        } else {
            this.nav.classList.remove('hidden');
            this.updateNav(viewId);
        }
    }

    showView(viewId) {
        this.views.forEach(v => v.classList.add('hidden'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.remove('hidden');

        // Refresh dynamic UI elements
        if (store.state.user) {
            document.getElementById('user-display').textContent = store.state.user.username;
            refreshSummaries();
            if (viewId === 'home') updateHomeStatus();
            if (viewId === 'system-info') startSystemInfoPolling();
            else stopSystemInfoPolling();
        }
    }

    updateNav(activeTarget) {
        this.navItems.forEach(item => {
            if (item.dataset.target === activeTarget) item.classList.add('active');
            else item.classList.remove('active');
        });
    }
}

// =========================================
// Page Logic Controllers
// =========================================

// --- Login Controller ---
function initLogin(router) {
    const form = document.getElementById('login-form');
    const err = document.getElementById('login-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        if (await store.login(user, pass)) {
            err.classList.add('hidden');
            router.navigate('home');
        } else {
            err.classList.remove('hidden');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        store.logout();
        router.navigate('login');
    });

    // Forgot Password Handler
    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('reset-password');
    });



    document.getElementById('login-to-signup').addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('signup');
    });
}

// --- Signup Controller ---
function initSignup(router) {
    const form = document.getElementById('signup-form');
    const err = document.getElementById('signup-error');
    const success = document.getElementById('signup-success');
    const backBtn = document.getElementById('back-to-login-from-signup');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('signup-user').value;
        const pass = document.getElementById('signup-pass').value;
        const confirmPass = document.getElementById('signup-confirm-pass').value;

        err.classList.add('hidden');
        success.classList.add('hidden');

        if (pass !== confirmPass) {
            err.textContent = 'Passwords do not match.';
            err.classList.remove('hidden');
            return;
        }

        if (pass.length < 6) {
            err.textContent = 'Password must be at least 6 characters.';
            err.classList.remove('hidden');
            return;
        }

        const result = await store.signup(user, pass);
        if (result.success) {
            success.classList.remove('hidden');
            setTimeout(() => {
                router.navigate('login');
            }, 2000);
        } else {
            err.textContent = result.message;
            err.classList.remove('hidden');
        }
    });

    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('login');
    });
}

// --- Reset Password Controller ---
function initResetPassword(router) {
    const form = document.getElementById('reset-password-form');
    const errorMsg = document.getElementById('reset-error');
    const successMsg = document.getElementById('reset-success');
    const backBtn = document.getElementById('back-to-login');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reset-username').value;
        const newPassword = document.getElementById('reset-new-password').value;

        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');

        if (newPassword.length < 6) {
            errorMsg.textContent = 'Password must be at least 6 characters long.';
            errorMsg.classList.remove('hidden');
            return;
        }

        if (await store.resetPassword(username, newPassword)) {
            successMsg.classList.remove('hidden');
            form.reset();
            setTimeout(() => {
                router.navigate('login');
            }, 2000);
        } else {
            errorMsg.textContent = 'User not found or error resetting password.';
            errorMsg.classList.remove('hidden');
        }
    });

    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('login');
    });
}


// --- Device Selection Controller ---
function initDeviceSelect() {
    const typeSelect = document.getElementById('device-type');
    const manSelect = document.getElementById('device-manufacturer');
    const form = document.getElementById('device-form');
    const step1 = document.getElementById('device-step-1');
    const step2 = document.getElementById('device-step-2');
    const btnNext = document.getElementById('btn-device-next');
    const btnBack = document.getElementById('btn-device-back');
    const btnNextContainer = document.getElementById('device-next-container');

    const manufacturers = {
        energy: ['L&T', 'L&K', 'Schneider', 'Elmeasure', 'Key Kad'],
        flow: ['LeHry', 'Ultrasonic', 'Water Meter']
    };

    // Load saved state if any
    if (store.state.config.device && store.state.config.device.type) {
        const saved = store.state.config.device;
        typeSelect.value = saved.type;
        populateMan(saved.type, saved.manufacturer);
        // If already saved, show step 2 below step 1 and disable step 1
        step2.classList.remove('hidden');
        typeSelect.disabled = true;
        if (btnNextContainer) btnNextContainer.classList.add('hidden');
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const type = typeSelect.value;
            if (!type) {
                alert('Please select a Device Type.');
                typeSelect.classList.add('input-invalid');
                return;
            }
            typeSelect.classList.remove('input-invalid');

            populateMan(type);
            step2.classList.remove('hidden');
            typeSelect.disabled = true;
            if (btnNextContainer) btnNextContainer.classList.add('hidden');
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            step2.classList.add('hidden');
            typeSelect.disabled = false;
            if (btnNextContainer) btnNextContainer.classList.remove('hidden');
            // Optionally clear manufacturer when going back
            manSelect.value = '';
        });
    }

    function populateMan(type, selectedVal = '') {
        manSelect.innerHTML = '<option value="">-- Select Manufacturer --</option>';
        if (manufacturers[type]) {
            manufacturers[type].forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                if (m === selectedVal) opt.selected = true;
                manSelect.appendChild(opt);
            });
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = typeSelect.value;
        const manufacturer = manSelect.value;

        if (!type || !manufacturer) {
            alert('Please complete all selection fields.');
            if (!type) typeSelect.classList.add('input-invalid');
            if (!manufacturer) manSelect.classList.add('input-invalid');
            return;
        }

        typeSelect.classList.remove('input-invalid');
        manSelect.classList.remove('input-invalid');

        store.updateDevice({
            type: type,
            manufacturer: manufacturer
        });
        showSummary('device');
    });
}

// --- Protocol Controller ---
function initProtocol() {
    const selectView = document.getElementById('protocol-select');
    const rtuSection = document.getElementById('proto-rtu');
    const tcpSection = document.getElementById('proto-tcp');

    window.protocolNav = (target) => {
        selectView.classList.add('hidden');
        rtuSection.classList.add('hidden');
        tcpSection.classList.add('hidden');

        if (target === 'rtu') rtuSection.classList.remove('hidden');
        else if (target === 'tcp') tcpSection.classList.remove('hidden');
        else selectView.classList.remove('hidden');
    };

    window.protocolNav('select');

    const rtuTable = document.querySelector('#rtu-table tbody');
    const saveRtuBtn = document.getElementById('save-rtu');
    const BAUD_RATES = ['2400', '4800', '9600', '19200', '38400', '57600', '115200'];
    const PARITY_OPTS = ['None', 'Odd', 'Even'];
    const DATA_BITS = ['7', '8'];
    const STOP_BITS = ['1', '2'];
    const FUNC_CODES = [
        { val: 1, label: '1' }, { val: 2, label: '2' }, { val: 3, label: '3' },
        { val: 4, label: '4' }, { val: 5, label: '5' }, { val: 6, label: '6' }, { val: 15, label: '15' }
    ];

    const createSelect = (options, selected, mapFn = (o) => o) => {
        const sel = document.createElement('select');
        options.forEach(opt => {
            const el = document.createElement('option');
            const { val, label } = mapFn(opt);
            el.value = val; el.textContent = label;
            if (String(val) === String(selected)) el.selected = true;
            sel.appendChild(el);
        });
        return sel;
    };

    const strMap = (s) => ({ val: s, label: s });

    document.getElementById('add-rtu-row').addEventListener('click', () => addRtuRow());

    function validateRtuRow(tr) {
        const ins = tr.querySelectorAll('input, select');
        let isValid = true;

        const slaveId = parseInt(ins[0].value);
        if (!checkField(ins[0], !isNaN(slaveId) && slaveId >= 1 && slaveId <= 247)) isValid = false;

        // Dropdowns (ins[1..5]) - already restricted by createSelect but check if empty if needed
        [1, 2, 3, 4, 5].forEach(idx => {
            if (!checkField(ins[idx], ins[idx].value !== '')) isValid = false;
        });

        if (!checkField(ins[6], ins[6].value.trim() !== '')) isValid = false; // Slave Addr
        if (!checkField(ins[7], ins[7].value.trim() !== '')) isValid = false; // Quantity

        return isValid;
    }

    function validateTcpRow(tr) {
        const ins = tr.querySelectorAll('input, select');
        let isValid = true;

        if (!checkField(ins[0], validateIPv4(ins[0].value))) isValid = false; // IP

        const port = parseInt(ins[1].value);
        if (!checkField(ins[1], !isNaN(port) && port >= 1 && port <= 65535)) isValid = false; // Port

        if (!checkField(ins[2], validateIPv4(ins[2].value))) isValid = false; // Gateway

        if (!checkField(ins[3], ins[3].value !== '')) isValid = false; // Func Code

        const slaveId = parseInt(ins[4].value);
        if (!checkField(ins[4], !isNaN(slaveId) && slaveId >= 0 && slaveId <= 255)) isValid = false; // Slave ID

        if (!checkField(ins[5], ins[5].value.trim() !== '')) isValid = false; // Slave Addr
        if (!checkField(ins[6], ins[6].value.trim() !== '')) isValid = false; // Quantity

        return isValid;
    }

    function validateIPv4(ip) {
        const regex = /^(25[0-5]|24[0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|24[0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|24[0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|24[0-9]|[01]?[0-9][0-9]?)$/;
        return regex.test(ip);
    }

    function checkField(el, isValid) {
        if (isValid) el.classList.remove('input-invalid');
        else el.classList.add('input-invalid');
        return isValid;
    }

    function addRtuRow(data = {}) {
        const tr = document.createElement('tr');
        const tdSn = document.createElement('td'); tdSn.className = 'sn-col'; tr.appendChild(tdSn);

        const tdSlave = document.createElement('td');
        const inpSlave = document.createElement('input');
        inpSlave.type = 'number'; inpSlave.className = 'w-tiny'; inpSlave.value = data.slaveId || '1';
        tdSlave.appendChild(inpSlave); tr.appendChild(tdSlave);

        const tdBaud = document.createElement('td'); tdBaud.appendChild(createSelect(BAUD_RATES, data.baud || '9600', strMap)); tr.appendChild(tdBaud);
        const tdParity = document.createElement('td'); tdParity.appendChild(createSelect(PARITY_OPTS, data.parity || 'None', strMap)); tr.appendChild(tdParity);
        const tdData = document.createElement('td'); tdData.appendChild(createSelect(DATA_BITS, data.dataBits || '8', strMap)); tr.appendChild(tdData);
        const tdStop = document.createElement('td'); tdStop.appendChild(createSelect(STOP_BITS, data.stopBits || '1', strMap)); tr.appendChild(tdStop);
        const tdFunc = document.createElement('td'); tdFunc.appendChild(createSelect(FUNC_CODES, data.funcCode || 3, (o) => ({ val: o.val, label: o.val }))); tr.appendChild(tdFunc);

        const tdSlaveAddr = document.createElement('td'); const inpSlaveAddr = document.createElement('input'); inpSlaveAddr.type = 'text'; inpSlaveAddr.className = 'w-addr'; inpSlaveAddr.value = data.slaveAddr || '0000'; tdSlaveAddr.appendChild(inpSlaveAddr); tr.appendChild(tdSlaveAddr);
        const tdQty = document.createElement('td'); const inpQty = document.createElement('input'); inpQty.type = 'text'; inpQty.className = 'w-tiny'; inpQty.value = data.quantity || '1'; tdQty.appendChild(inpQty); tr.appendChild(tdQty);

        const tdAction = document.createElement('td');
        const btnDel = document.createElement('button'); btnDel.className = 'btn-del'; btnDel.innerHTML = '×';
        btnDel.onclick = () => { tr.remove(); updateSn(rtuTable); }; tdAction.appendChild(btnDel); tr.appendChild(tdAction);

        tr.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', () => validateRtuRow(tr));
        });

        rtuTable.appendChild(tr);
        updateSn(rtuTable);
        validateRtuRow(tr);
    }

    function updateSn(table) {
        Array.from(table.children).forEach((tr, i) => {
            if (tr.cells[0]) tr.cells[0].textContent = i + 1;
        });
    }

    saveRtuBtn.addEventListener('click', () => {
        const rows = [];
        const trs = Array.from(rtuTable.children);
        let allValid = true;

        trs.forEach(tr => {
            if (!validateRtuRow(tr)) {
                allValid = false;
            }
            const ins = tr.querySelectorAll('input, select');
            rows.push({
                slaveId: ins[0].value, baud: ins[1].value, parity: ins[2].value,
                dataBits: ins[3].value, stopBits: ins[4].value, funcCode: ins[5].value,
                slaveAddr: ins[6].value, quantity: ins[7].value
            });
        });

        if (!allValid) {
            alert('Please fix errors in the RTU table before saving.');
            return;
        }

        store.updateProtocol('rtu', rows);
        alert('RTU Config Saved!');
        showSummary('protocol');
    });

    const tcpTable = document.querySelector('#tcp-table tbody');
    const saveTcpBtn = document.getElementById('save-tcp');
    document.getElementById('add-tcp-row').addEventListener('click', () => addTcpRow());

    function addTcpRow(data = {}) {
        const tr = document.createElement('tr');
        const tdSn = document.createElement('td'); tdSn.className = 'sn-col'; tr.appendChild(tdSn);
        const tdIp = document.createElement('td'); const inpIp = document.createElement('input'); inpIp.type = 'text'; inpIp.className = 'w-addr'; inpIp.value = data.ip || ''; tdIp.appendChild(inpIp); tr.appendChild(tdIp);
        const tdPort = document.createElement('td'); const inpPort = document.createElement('input'); inpPort.type = 'number'; inpPort.className = 'w-tiny'; inpPort.value = data.port || '502'; tdPort.appendChild(inpPort); tr.appendChild(tdPort);
        const tdGate = document.createElement('td'); const inpGate = document.createElement('input'); inpGate.type = 'text'; inpGate.className = 'w-addr'; inpGate.value = data.gateway || '192.168.1.1'; tdGate.appendChild(inpGate); tr.appendChild(tdGate);
        const tdFunc = document.createElement('td'); tdFunc.appendChild(createSelect(FUNC_CODES, data.funcCode || 3, (o) => ({ val: o.val, label: o.val }))); tr.appendChild(tdFunc);
        const tdSlave = document.createElement('td'); const inpSlave = document.createElement('input'); inpSlave.type = 'number'; inpSlave.className = 'w-tiny'; inpSlave.value = data.slaveId || '1'; tdSlave.appendChild(inpSlave); tr.appendChild(tdSlave);

        const tdSlaveAddr = document.createElement('td'); const inpSlaveAddr = document.createElement('input'); inpSlaveAddr.type = 'text'; inpSlaveAddr.className = 'w-addr'; inpSlaveAddr.value = data.slaveAddr || '0000'; tdSlaveAddr.appendChild(inpSlaveAddr); tr.appendChild(tdSlaveAddr);
        const tdQty = document.createElement('td'); const inpQty = document.createElement('input'); inpQty.type = 'text'; inpQty.className = 'w-tiny'; inpQty.value = data.quantity || '1'; tdQty.appendChild(inpQty); tr.appendChild(tdQty);

        const tdAction = document.createElement('td');
        const btnDel = document.createElement('button'); btnDel.className = 'btn-del'; btnDel.innerHTML = '×';
        btnDel.onclick = () => { tr.remove(); updateSn(tcpTable); }; tdAction.appendChild(btnDel); tr.appendChild(tdAction);

        tr.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', () => validateTcpRow(tr));
        });

        tcpTable.appendChild(tr);
        updateSn(tcpTable);
        validateTcpRow(tr);
    }

    saveTcpBtn.addEventListener('click', () => {
        const rows = [];
        const trs = Array.from(tcpTable.children);
        let allValid = true;

        trs.forEach(tr => {
            if (!validateTcpRow(tr)) {
                allValid = false;
            }
            const ins = tr.querySelectorAll('input, select');
            rows.push({
                ip: ins[0].value, port: ins[1].value, gateway: ins[2].value,
                funcCode: ins[3].value, slaveId: ins[4].value,
                slaveAddr: ins[5].value, quantity: ins[6].value
            });
        });

        if (!allValid) {
            alert('Please fix errors in the TCP table before saving.');
            return;
        }

        store.updateProtocol('tcp', rows);
        alert('TCP Config Saved!');
        showSummary('protocol');
    });

    const saved = store.state.config.protocol;
    if (saved.rtuRows && saved.rtuRows.length) saved.rtuRows.forEach(r => addRtuRow(r)); else addRtuRow();
    if (saved.tcpRows && saved.tcpRows.length) saved.tcpRows.forEach(r => addTcpRow(r)); else addTcpRow();
}

// --- Connections Controller ---
function initConnections() {
    const btnShowHttp = document.getElementById('btn-show-http');
    const btnShowMqtt = document.getElementById('btn-show-mqtt');
    const httpContainer = document.getElementById('conn-http-container');
    const mqttContainer = document.getElementById('conn-mqtt-container');

    const switchTab = (tab) => {
        if (tab === 'http') {
            btnShowHttp.classList.add('active'); btnShowMqtt.classList.remove('active');
            httpContainer.classList.remove('hidden'); mqttContainer.classList.add('hidden');
        } else {
            btnShowMqtt.classList.add('active'); btnShowHttp.classList.remove('active');
            mqttContainer.classList.remove('hidden'); httpContainer.classList.add('hidden');
        }
        store.updateConnectionsTab(tab);
    };

    btnShowHttp.addEventListener('click', () => switchTab('http'));
    btnShowMqtt.addEventListener('click', () => switchTab('mqtt'));

    let currentStep = 1;
    let selectedPlatform = store.state.config.connections.mqtt?.platform || '';

    // Restore UI state for platform selection
    if (selectedPlatform) {
        const btn = document.querySelector(`.platform-card[data-platform="${selectedPlatform}"]`);
        if (btn) btn.classList.add('selected');
    }

    const showStep = (step) => {
        [1, 2, 3, 4].forEach(s => {
            const el = document.getElementById(`mqtt-step-${s}`);
            if (s === step) el.classList.remove('hidden'); else el.classList.add('hidden');
        });
        currentStep = step;
    };

    const autoFillBoodskap = () => {
        const env = document.getElementById('mqtt-env').value;
        const broker = document.getElementById('mqtt-broker');
        const user = document.getElementById('mqtt-user');
        const pass = document.getElementById('mqtt-pass');

        if (env === 'other') {
            broker.value = '';
            user.value = '';
            pass.value = '';
            return;
        }

        if (selectedPlatform === 'boodskap') {
            broker.value = 'zedbee.io';
            if (env === 'testing') {
                user.value = 'test';
                pass.value = 'test@123';
            } else {
                user.value = 'production';
                pass.value = 'production@123';
            }
        }
    };

    document.getElementById('mqtt-env').addEventListener('change', autoFillBoodskap);

    const platformBtns = document.querySelectorAll('.platform-card');
    platformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            platformBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPlatform = btn.dataset.platform;
            store.updateMQTT('root', { platform: selectedPlatform });
            autoFillBoodskap(); // Fill if Boodskap
            showStep(2);
        });
    });

    const formDetails = document.getElementById('mqtt-details-form');
    document.getElementById('btn-mqtt-back-1').addEventListener('click', () => showStep(1));
    formDetails.addEventListener('submit', (e) => {
        e.preventDefault();
        store.updateMQTT('root', { platformType: document.getElementById('mqtt-env').value });
        store.updateMQTT('broker', {
            url: document.getElementById('mqtt-broker').value,
            user: document.getElementById('mqtt-user').value,
            pass: document.getElementById('mqtt-pass').value
        });
        showStep(3);
    });

    const formDevice = document.getElementById('mqtt-device-form');
    document.getElementById('btn-mqtt-back-2').addEventListener('click', () => showStep(2));
    formDevice.addEventListener('submit', (e) => {
        e.preventDefault();
        const devId = document.getElementById('mqtt-device-id').value.trim();
        store.updateMQTT('root', { deviceId: devId });

        if (selectedPlatform === 'boodskap') {
            document.getElementById('mqtt-pub').value = `/BHEZISEWY/device/${devId}/msgs/gateway/1/106`;
            document.getElementById('mqtt-sub').value = `/BHEZISEWY/device/${devId}/cmds`;
            document.getElementById('mqtt-ack').value = `/BHEZISEWY/device/${devId}/msgs/gateway/1/103`;
        } else {
            document.getElementById('mqtt-pub').value = `${devId}/publish`;
            document.getElementById('mqtt-sub').value = `${devId}/subscribe`;
            document.getElementById('mqtt-ack').value = `${devId}/ack`;
        }
        showStep(4);
    });

    const formTopics = document.getElementById('mqtt-topics-form');
    document.getElementById('btn-mqtt-back-3').addEventListener('click', () => showStep(3));
    formTopics.addEventListener('submit', (e) => {
        e.preventDefault();
        store.updateMQTT('topics', {
            pub: document.getElementById('mqtt-pub').value,
            sub: document.getElementById('mqtt-sub').value,
            ack: document.getElementById('mqtt-ack').value
        });
        alert('MQTT Config Saved!');
        showSummary('connections');
    });
}

// --- System Info Controller ---
let sysInfoInterval = null;

function initSystemInfo() {
    // Initial fetch if active
    if (!document.getElementById('view-system-info').classList.contains('hidden')) {
        startSystemInfoPolling();
    }
}

function startSystemInfoPolling() {
    if (sysInfoInterval) return;
    fetchSystemInfo(); // Immediate call
    sysInfoInterval = setInterval(fetchSystemInfo, 3000);
}

function stopSystemInfoPolling() {
    if (sysInfoInterval) {
        clearInterval(sysInfoInterval);
        sysInfoInterval = null;
    }
}

async function fetchSystemInfo() {
    try {
        const res = await fetch('http://localhost:5000/system-info');
        if (!res.ok) throw new Error('Failed to fetch system info');
        const data = await res.json();
        updateSystemInfoUI(data);
    } catch (err) {
        console.error('System Info Fetch Error:', err);
    }
}

function updateSystemInfoUI(data) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set('sys-os', data.os);
    set('sys-hostname', data.hostname);
    set('sys-cpu', `${data.cpu_percent}%`);
    set('sys-ram', `${data.ram_percent}% (${data.ram_used} / ${data.ram_total} GB)`);
    set('sys-disk', `${data.disk_percent}%`);
    set('sys-uptime', formatUptime(data.uptime_minutes));
    set('sys-reboot', data.last_reboot);
    set('sys-sent', `${data.net_sent} MB`);
    set('sys-recv', `${data.net_recv} MB`);
}

function formatUptime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// --- Settings Controller ---
function initSettings() {
    const form = document.getElementById('settings-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const curr = document.getElementById('set-curr-pass').value;
        const newP = document.getElementById('set-new-pass').value;

        if (await store.updatePassword(curr, newP)) {
            alert('Password updated successfully. Please login again.');
            store.logout();
            window.router.navigate('login');
        } else {
            alert('Current password incorrect or error updating password.');
        }
    });
}

// --- Shared Utils ---
window.togglePassword = function (btn) {
    const group = btn.closest('.password-group');
    const input = group.querySelector('input');
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    // Update SVG icon
    const svg = btn.querySelector('svg');
    if (type === 'text') {
        svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
};

function showSummary(sectionId) {
    const el = document.getElementById(`summary-${sectionId}`);
    if (el) {
        el.querySelector('.summary-content').innerHTML = store.getSummary(sectionId);
        el.classList.remove('hidden');
    }
}

function refreshSummaries() {
    showSummary('device'); showSummary('protocol');
}

function updateHomeStatus() {
    const cfg = store.state.config;
    let completedSteps = 0;
    if (cfg.device && cfg.device.type) completedSteps++;
    if (cfg.protocol && cfg.protocol.mode) completedSteps++;
    if (cfg.connections.mqtt && cfg.connections.mqtt.deviceId) completedSteps++;

    const statusConfigEl = document.getElementById('home-status-config');
    const statusStepsEl = document.getElementById('home-status-steps');
    if (statusConfigEl) statusConfigEl.textContent = completedSteps === 3 ? 'Complete' : (completedSteps === 0 ? 'Not Started' : 'In Progress');
    if (statusStepsEl) statusStepsEl.textContent = `${completedSteps}/3`;
}

// =========================================
// App Bootstrap
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
    window.router = new Router();

    // Verify Session
    await store.verifySession();

    initLogin(window.router);
    initSignup(window.router);
    initResetPassword(window.router);
    initDeviceSelect();
    initProtocol();
    initConnections();
    initSettings();
    initSystemInfo();

    window.router.navigate(store.state.user ? 'home' : 'login');
});
