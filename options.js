// 预定义的按键分组（基于最新B站快捷键）
const playbackKeys = [
  { label: '暂停/播放', key: ' ', display: 'Space' },
  { label: '快进', key: 'ArrowRight' },
  { label: '快退', key: 'ArrowLeft' },
  { label: '音量增大', key: 'ArrowUp' },
  { label: '音量减小', key: 'ArrowDown' },
  { label: '1倍速', key: '1' },   // Shift+1，但需放开数字键
  { label: '2倍速', key: '2' },
  { label: '3倍速', key: '3' }
];

const interactKeys = [
  { label: '点赞 (Q/R)', key: 'q' },
  { label: '点赞 (R)', key: 'r' },
  { label: '投币 (W)', key: 'w' },
  { label: '收藏 (E)', key: 'e' },
  { label: '发送弹幕', key: 'Enter' },
  { label: '开关弹幕列表 (D)', key: 'd' },
  { label: '开关静音 (M)', key: 'm' },
  { label: '快速搜索 (Alt+S)', key: 's' }   // 需配合 Alt，单独放开 s 即可
];

const fullscreenKeys = [
  { label: '全屏/退出 (F)', key: 'f' },
  { label: '退出全屏 (Esc)', key: 'Escape' },
  { label: '浏览器全屏 (F11)', key: 'F11' }
];

const navigationKeys = [
  { label: '上一P [', key: '[' },
  { label: '下一P ]', key: ']' },
  { label: '上一P {', key: '{' },
  { label: '下一P }', key: '}' },
  { label: '页面向下 (PgDn)', key: 'PageDown' },
  { label: '页面向上 (PgUp)', key: 'PageUp' },
  { label: '跳到页首 (Home)', key: 'Home' },
  { label: '跳到页尾 (End)', key: 'End' }
];

const liveKeys = [
  { label: '快捷发言 F1', key: 'F1' },
  { label: '快捷发言 F2', key: 'F2' },
  { label: '快捷发言 F3', key: 'F3' },
  { label: '快捷发言 F4', key: 'F4' },
  { label: '快捷发言 F6', key: 'F6' },
  { label: '快捷发言 F7', key: 'F7' }
];

const functionKeys = [
  { label: 'F5 (刷新)', key: 'F5' },
  { label: 'F8', key: 'F8' },
  { label: 'F9', key: 'F9' },
  { label: 'F10', key: 'F10' },
  { label: 'F12', key: 'F12' }
];

// 默认允许的按键（与 content.js 保持一致）
const DEFAULT_ALLOWED = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
let currentAllowedKeys = [...DEFAULT_ALLOWED];

// 保存到 chrome.storage
function saveKeys() {
  chrome.storage.sync.set({ allowedKeys: currentAllowedKeys }, () => {
    console.log('已保存允许的按键:', currentAllowedKeys);
  });
}

// 生成复选框分组
function renderGroup(containerId, keysArray) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  keysArray.forEach(item => {
    // 去重：如果多个条目有相同 key，只显示第一个（例如 ArrowRight 出现两次）
    const existing = container.querySelector(`[data-key="${CSS.escape(item.key)}"]`);
    if (existing) return;

    const div = document.createElement('div');
    div.className = 'key-item';
    const id = `key-${item.key.replace(/\s/g, '_')}`;
    const checked = currentAllowedKeys.includes(item.key);
    div.innerHTML = `
      <input type="checkbox" id="${id}" data-key="${item.key}" ${checked ? 'checked' : ''}>
      <label for="${id}">${item.label} <span class="description">(${item.display || item.key})</span></label>
    `;
    container.appendChild(div);

    div.querySelector('input').addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      if (e.target.checked) {
        if (!currentAllowedKeys.includes(key)) currentAllowedKeys.push(key);
      } else {
        currentAllowedKeys = currentAllowedKeys.filter(k => k !== key);
      }
      saveKeys();
    });
  });
}

// 手动添加按键
function addCustomKeyToList(keyValue) {
  const val = keyValue.trim();
  if (!val) return;
  if (currentAllowedKeys.includes(val)) {
    document.getElementById('addStatus').textContent = '该键已存在';
    return;
  }
  currentAllowedKeys.push(val);
  saveKeys();
  renderCustomKeyList();
  document.getElementById('addStatus').textContent = '已添加';
  document.getElementById('customKeyInput').value = '';
}

// 渲染手动添加的列表（可删除）
function renderCustomKeyList() {
  const container = document.getElementById('customKeyList');
  container.innerHTML = '';
  // 找出所有预定义 key，以便只显示手动添加的
  const allPredefined = [
    ...playbackKeys, ...interactKeys, ...fullscreenKeys,
    ...navigationKeys, ...liveKeys, ...functionKeys
  ].map(i => i.key);
  const customOnly = currentAllowedKeys.filter(k => !allPredefined.includes(k));

  if (customOnly.length === 0) {
    container.innerHTML = '<span style="color:#888;">暂无手动添加的按键</span>';
    return;
  }

  customOnly.forEach(key => {
    const div = document.createElement('div');
    div.className = 'key-item';
    div.innerHTML = `
      <span style="font-family:monospace;">${key}</span>
      <button class="remove-btn" data-key="${key}" style="margin-left:5px;padding:0 5px;">✕</button>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.target.dataset.key;
      currentAllowedKeys = currentAllowedKeys.filter(k => k !== key);
      saveKeys();
      renderCustomKeyList();
    });
  });
}

// 初始化
async function init() {
  const result = await chrome.storage.sync.get(['allowedKeys']);
  if (result.allowedKeys && Array.isArray(result.allowedKeys)) {
    currentAllowedKeys = result.allowedKeys;
  } else {
    currentAllowedKeys = [...DEFAULT_ALLOWED];
  }

  renderGroup('playbackKeys', playbackKeys);
  renderGroup('interactKeys', interactKeys);
  renderGroup('fullscreenKeys', fullscreenKeys);
  renderGroup('navigationKeys', navigationKeys);
  renderGroup('liveKeys', liveKeys);
  renderGroup('functionKeys', functionKeys);
  renderCustomKeyList();

  document.getElementById('addCustomKey').addEventListener('click', () => {
    addCustomKeyToList(document.getElementById('customKeyInput').value);
  });
  document.getElementById('customKeyInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCustomKeyToList(e.target.value);
  });
}

init();