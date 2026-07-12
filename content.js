(function () {
  const DEFAULT_ALLOWED_KEYS = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
  let allowedKeys = [...DEFAULT_ALLOWED_KEYS];

  // 判断是否可编辑元素（含 contenteditable 和 ARIA textbox）
  function isEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (isInput) return true;
    if (target.isContentEditable) return true;
    // B站评论区可能用 role="textbox" 的 div
    const role = target.getAttribute('role');
    if (role === 'textbox' || role === 'searchbox') return true;
    // 向上查找 contenteditable / textbox 祖先（捕获阶段 target 可能是内部子元素）
    let el = target.parentElement;
    while (el) {
      if (el.isContentEditable) return true;
      const r = el.getAttribute('role');
      if (r === 'textbox' || r === 'searchbox') return true;
      el = el.parentElement;
    }
    return false;
  }

  // 同步检查是否允许
  function isAllowedKey(e) {
    return allowedKeys.includes(e.key) || allowedKeys.includes(e.code);
  }

  // 是否修饰键组合（Ctrl/Alt/Meta — 系统快捷键如复制粘贴等，一律放行）
  function hasModifier(e) {
    return e.ctrlKey || e.altKey || e.metaKey;
  }

  // 事件处理
  function blockKeydown(e) {
    if (hasModifier(e)) return;   // Ctrl+C, Ctrl+V 等系统组合键不拦截
    if (isEditable(e.target)) return;
    if (isAllowedKey(e)) return;

    e.preventDefault();
    e.stopPropagation();
  }

  // 从存储中加载允许键列表
  function loadSettings() {
    chrome.storage.sync.get(['allowedKeys'], (result) => {
      if (result.allowedKeys && Array.isArray(result.allowedKeys)) {
        allowedKeys = result.allowedKeys;
      } else {
        allowedKeys = [...DEFAULT_ALLOWED_KEYS];
      }
    });
  }

  // 初始化：读取设置并监听变化
  loadSettings();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.allowedKeys) {
      allowedKeys = changes.allowedKeys.newValue || [...DEFAULT_ALLOWED_KEYS];
    }
  });

  // 注册事件（捕获阶段，仅 keydown 即可覆盖所有快捷键）
  document.addEventListener('keydown', blockKeydown, true);
})();
