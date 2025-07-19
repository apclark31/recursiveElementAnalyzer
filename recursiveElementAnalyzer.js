// Recursive Element Analyzer - Part 1: Basic Framework and UI
(function() {
  // Global variables
  window.rea = {
    inspectMode: false,
    highlightedElement: null,
    originalOutline: '',
    selectedElement: null,
    analyzedElements: new Map(),
    contentElements: {},
    selectorInput: null,
    depthSelect: null,
    modeSelect: null,
    settings: {
      maxDisplayDepth: 10,
      maxTextLength: 500,
      maxChildrenDisplay: 50,
      maxExportChildren: 1000,
      maxExportSize: 1000000,
      jsContextSize: 300,
      enableExtendedSearch: true,
      includeCSSVariables: true,
      includeInheritedStyles: true,
      includeJavaScript: true,
      structureAndCSSOnly: false
    },
    inheritableProperties: [
      'color', 'font', 'font-family', 'font-size', 'font-weight', 'font-variant', 
      'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-indent', 
      'text-transform', 'white-space', 'word-spacing', 'word-break', 'word-wrap',
      'visibility', 'border-collapse', 'border-spacing', 'caption-side', 'empty-cells',
      'list-style', 'list-style-image', 'list-style-position', 'list-style-type', 
      'orphans', 'widows', 'cursor', 'direction', 'tab-size', 'quotes',
      'text-decoration-color', 'text-shadow'
    ]
  };
  
  // Create UI container
  window.rea.createUI = function() {
    // Remove existing UI if present
    const existingUI = document.getElementById('element-inspector-ui');
    if (existingUI) document.body.removeChild(existingUI);
  
    // Create main container
    const container = document.createElement('div');
    container.id = 'element-inspector-ui';
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; width: 480px; max-height: 80vh;
      background-color: #fff; border: 1px solid #ccc; border-radius: 5px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2); z-index: 9999; font-family: Arial, sans-serif;
      overflow: hidden; display: flex; flex-direction: column; font-size: 14px; line-height: 1.4;
    `;
  
    // Create header
    const header = document.createElement('div');
    header.className = 'inspector-header';
    header.style.cssText = `
      padding: 12px 15px; background-color: #f5f5f5; border-bottom: 1px solid #ddd;
      display: flex; justify-content: space-between; align-items: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Recursive Element Inspector';
    title.style.cssText = 'margin: 0; font-size: 16px; font-weight: bold;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'close-button';
    closeBtn.style.cssText = `
      border: none; background: none; font-size: 22px; cursor: pointer;
      padding: 0; line-height: 1; color: #555;
    `;
    closeBtn.onclick = () => {
      document.body.removeChild(container);
      window.rea.stopInspecting();
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);
  
    // Create controls section
    const controls = document.createElement('div');
    controls.className = 'inspector-controls';
    controls.style.cssText = 'padding: 12px 15px; border-bottom: 1px solid #ddd; background-color: #f9f9f9;';
    
    const selectorInput = document.createElement('input');
    selectorInput.type = 'text';
    selectorInput.placeholder = 'Enter CSS selector or use picker';
    selectorInput.className = 'selector-input';
    selectorInput.style.cssText = `
      width: 100%; padding: 8px 10px; box-sizing: border-box; margin-bottom: 12px;
      border: 1px solid #ddd; border-radius: 4px; font-size: 14px;
    `;
    
    // Add recursive depth option
    const depthContainer = document.createElement('div');
    depthContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
    
    const depthLabel = document.createElement('label');
    depthLabel.textContent = 'Recursion Depth:';
    depthLabel.style.cssText = 'font-size: 14px;';
    
    const depthSelect = document.createElement('select');
    depthSelect.className = 'depth-select';
    depthSelect.style.cssText = 'padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 100px;';
    
    // Add options for recursion depth
    [
      { value: '0', text: 'None' },
      { value: '1', text: '1 Level' },
      { value: '2', text: '2 Levels' },
      { value: '3', text: '3 Levels' },
      { value: 'all', text: 'All Children' }
    ].forEach(option => {
      const optElement = document.createElement('option');
      optElement.value = option.value;
      optElement.textContent = option.text;
      depthSelect.appendChild(optElement);
    });
    
    // Default to 1 level of recursion
    depthSelect.value = '1';
    
    depthContainer.appendChild(depthLabel);
    depthContainer.appendChild(depthSelect);
    
    // Add analysis mode option
    const modeContainer = document.createElement('div');
    modeContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
    
    const modeLabel = document.createElement('label');
    modeLabel.textContent = 'Analysis Mode:';
    modeLabel.style.cssText = 'font-size: 14px;';
    
    const modeSelect = document.createElement('select');
    modeSelect.className = 'mode-select';
    modeSelect.style.cssText = 'padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 160px;';
    
    // Add options for analysis mode
    [
      { value: 'full', text: 'Full Analysis' },
      { value: 'structure', text: 'Structure Only' },
      { value: 'css', text: 'CSS Only' },
      { value: 'js', text: 'JavaScript Only' },
      { value: 'structure-css', text: 'Structure & CSS Only' },
      { value: 'architecture', text: 'Architecture Analysis' }
    ].forEach(option => {
      const optElement = document.createElement('option');
      optElement.value = option.value;
      optElement.textContent = option.text;
      modeSelect.appendChild(optElement);
    });
    
    modeContainer.appendChild(modeLabel);
    modeContainer.appendChild(modeSelect);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
    
    const pickBtn = document.createElement('button');
    pickBtn.textContent = 'Pick Element';
    pickBtn.className = 'picker-button';
    pickBtn.style.cssText = `
      padding: 10px 12px; background-color: #4CAF50; color: white;
      border: none; border-radius: 4px; cursor: pointer; flex: 1;
      font-size: 14px; font-weight: 500;
    `;
    
    const analyzeBtn = document.createElement('button');
    analyzeBtn.textContent = 'Analyze';
    analyzeBtn.className = 'analyze-button';
    analyzeBtn.style.cssText = `
      padding: 10px 12px; background-color: #2196F3; color: white;
      border: none; border-radius: 4px; cursor: pointer; flex: 1;
      font-size: 14px; font-weight: 500;
    `;
    
    buttonContainer.appendChild(pickBtn);
    buttonContainer.appendChild(analyzeBtn);
    
    controls.appendChild(selectorInput);
    controls.appendChild(depthContainer);
    controls.appendChild(modeContainer);
    controls.appendChild(buttonContainer);
    container.appendChild(controls);
  
    // Create results section
    const results = document.createElement('div');
    results.className = 'results-container';
    results.style.cssText = 'display: flex; flex-direction: column; flex: 1; overflow: hidden;';
    container.appendChild(results);
  
    // Add tab system for results
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    tabContainer.style.cssText = 'display: flex; border-bottom: 1px solid #ddd; background-color: #f5f5f5;';
    
    const tabs = ['Structure', 'CSS', 'JavaScript', 'Summary'];
    const tabElements = {};
    const contentElements = {};
    
    tabs.forEach(tabName => {
      const tab = document.createElement('div');
      tab.textContent = tabName;
      tab.className = 'tab';
      tab.dataset.tab = tabName.toLowerCase();
      tab.style.cssText = `
        padding: 12px 15px; cursor: pointer; border-bottom: 3px solid transparent;
        white-space: nowrap; flex: 1; text-align: center; font-size: 14px;
      `;
      
      // Create content area for this tab
      const content = document.createElement('div');
      content.className = 'tab-content';
      content.dataset.content = tabName.toLowerCase();
      content.style.cssText = 'display: none; padding: 15px; overflow-y: auto; height: 100%;';
      
      // Add click handler to tab
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        Object.values(tabElements).forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.fontWeight = 'normal';
          t.style.backgroundColor = 'transparent';
        });
        
        // Add active class to current tab
        tab.classList.add('active');
        tab.style.borderBottomColor = '#2196F3';
        tab.style.fontWeight = 'bold';
        tab.style.backgroundColor = '#fff';
        
        // Show corresponding content
        Object.values(contentElements).forEach(c => {
          c.style.display = 'none';
        });
        content.style.display = 'block';
      });
      
      tabContainer.appendChild(tab);
      tabElements[tabName.toLowerCase()] = tab;
      contentElements[tabName.toLowerCase()] = content;
    });
    
    results.appendChild(tabContainer);
    
    // Create content wrapper for scrolling
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';
    contentWrapper.style.cssText = 'flex: 1; overflow-y: auto; position: relative;';
    
    // Add all content areas to the wrapper
    Object.values(contentElements).forEach(content => {
      contentWrapper.appendChild(content);
    });
    
    results.appendChild(contentWrapper);
  
    // Initialize with Structure tab active
    tabElements.structure.classList.add('active');
    tabElements.structure.style.borderBottomColor = '#2196F3';
    tabElements.structure.style.fontWeight = 'bold';
    tabElements.structure.style.backgroundColor = '#fff';
    contentElements.structure.style.display = 'block';
  
    // Add global styles
    window.rea.addGlobalStyles();
  
    return { 
      container, 
      selectorInput, 
      depthSelect,
      modeSelect, 
      pickBtn, 
      analyzeBtn, 
      contentElements,
      tabElements
    };
  };

  // Function to add global styles
  window.rea.addGlobalStyles = function() {
    // Remove existing styles if present
    const existingStyles = document.getElementById('element-inspector-styles');
    if (existingStyles) {
      document.head.removeChild(existingStyles);
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'element-inspector-styles';
    styleEl.textContent = `
      #element-inspector-ui {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      #element-inspector-ui pre {
        background-color: #f8f9fa; padding: 12px; border-radius: 4px;
        border-left: 3px solid #2196F3; overflow-x: auto; margin: 8px 0 15px 0;
        font-family: Consolas, Monaco, 'Andale Mono', monospace;
        font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
      }
      
      #element-inspector-ui ul { padding-left: 20px; margin: 0 0 15px 0; }
      #element-inspector-ui li { margin-bottom: 6px; }
      
      #element-inspector-ui h4, #element-inspector-ui h5, #element-inspector-ui h6 {
        margin: 18px 0 10px 0; font-weight: bold; color: #333;
      }
      
      #element-inspector-ui h4 {
        font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;
      }
      
      #element-inspector-ui h5 { font-size: 15px; }
      #element-inspector-ui h6 { font-size: 14px; }
      #element-inspector-ui p { margin: 0 0 12px 0; line-height: 1.5; }
      
      #element-inspector-ui .source-info {
        font-size: 12px; color: #666; margin: 15px 0 6px 0;
        padding-left: 2px; font-style: italic;
      }
      
      #element-inspector-ui .source-url { font-family: monospace; word-break: break-all; }
      
      #element-inspector-ui .media-query {
        font-weight: normal; color: #0277bd; margin-left: 5px;
      }
      
      #element-inspector-ui .export-button {
        padding: 12px 15px; background-color: #673AB7; color: white;
        border: none; border-radius: 4px; cursor: pointer; margin: 15px 15px 15px 15px;
        width: calc(100% - 30px); font-size: 14px; font-weight: bold; transition: background-color 0.2s;
      }
      
      #element-inspector-ui .export-button:hover { background-color: #5e35b1; }
      
      #element-inspector-ui .tab.active {
        border-bottom-color: #2196F3; background-color: #fff; font-weight: bold;
      }
      
      #element-inspector-ui button:hover { opacity: 0.9; }
      
      #element-inspector-ui .selector-input:focus {
        border-color: #2196F3; outline: none;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
      
      #element-inspector-ui .tree-view {
        margin-left: 15px; border-left: 1px dashed #ccc; padding-left: 15px;
      }
      
      #element-inspector-ui .tree-node {
        margin: 5px 0; position: relative;
      }
      
      #element-inspector-ui .tree-node:before {
        content: ""; position: absolute; left: -16px; top: 10px;
        width: 10px; height: 1px; background-color: #ccc;
      }
      
      #element-inspector-ui .tree-node-content {
        cursor: pointer; padding: 3px 5px; border-radius: 3px;
        transition: background-color 0.2s;
      }
      
      #element-inspector-ui .tree-node-content:hover { background-color: #f0f0f0; }
      
      #element-inspector-ui .tree-node-content.selected {
        background-color: #e3f2fd; border: 1px solid #bbdefb;
      }
      
      #element-inspector-ui .tree-node-tag { color: #1976D2; font-weight: bold; }
      #element-inspector-ui .tree-node-id { color: #D32F2F; }
      #element-inspector-ui .tree-node-class { color: #388E3C; }
      
      #element-inspector-ui .tree-node-text {
        color: #555; font-style: italic; margin-left: 5px;
      }
      
      #element-inspector-ui .tree-toggle {
        cursor: pointer; color: #666; margin-right: 5px;
        display: inline-block; width: 16px; text-align: center;
        transition: transform 0.2s;
      }
      
      #element-inspector-ui .tree-toggle.expanded { transform: rotate(90deg); }
      
      #element-inspector-ui .progress-bar {
        width: 100%; height: 4px; background-color: #e0e0e0;
        margin-bottom: 10px; overflow: hidden; border-radius: 2px;
      }
      
      #element-inspector-ui .progress-fill {
        height: 100%; background-color: #2196F3; width: 0%; transition: width 0.3s ease;
      }
      
      #element-inspector-ui .progress-status { font-size: 12px; color: #666; margin-bottom: 10px; }
      
      #element-inspector-ui .stats-container {
        display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;
      }
      
      #element-inspector-ui .stat-box {
        background-color: #f5f5f5; border-radius: 4px;
        padding: 10px; flex: 1; min-width: 120px; text-align: center;
      }
      
      #element-inspector-ui .stat-number {
        font-size: 24px; font-weight: bold; color: #2196F3;
      }
      
      #element-inspector-ui .stat-label {
        font-size: 12px; color: #666; margin-top: 5px;
      }
      
      #element-inspector-ui table {
        width: 100%; border-collapse: collapse; margin-bottom: 15px;
      }
      
      #element-inspector-ui th {
        background-color: #f5f5f5; text-align: left; padding: 8px;
        border-bottom: 2px solid #ddd; font-weight: bold;
      }
      
      #element-inspector-ui td { padding: 8px; border-bottom: 1px solid #eee; }
      #element-inspector-ui tr:hover { background-color: #f9f9f9; }
      
      #element-inspector-ui .css-property-name {
        color: #0D47A1;
        font-weight: bold;
      }
      
      #element-inspector-ui .css-property-value {
        color: #2E7D32;
      }
      
      #element-inspector-ui .css-section {
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      #element-inspector-ui .css-source {
        font-size: 12px;
        color: #666;
        margin-bottom: 5px;
      }
      
      #element-inspector-ui .css-selector {
        font-weight: bold;
        color: #7B1FA2;
      }
      
      #element-inspector-ui .css-property-list {
        margin-left: 15px;
        margin-top: 5px;
      }
      
      /* Architecture Analysis Styles */
      #element-inspector-ui .architecture-stats {
        display: flex;
        gap: 20px;
        margin: 15px 0;
      }
      
      #element-inspector-ui .stat-group {
        flex: 1;
        background: #f9f9f9;
        padding: 12px;
        border-radius: 5px;
        border-left: 3px solid #4CAF50;
      }
      
      #element-inspector-ui .stat-group h4 {
        margin-top: 0;
        color: #4CAF50;
        border-bottom: none;
        font-size: 14px;
      }
      
      #element-inspector-ui .export-info {
        background: #e3f2fd;
        padding: 15px;
        border-radius: 5px;
        border-left: 3px solid #2196F3;
        margin: 15px 0;
      }
      
      #element-inspector-ui .export-info h4 {
        margin-top: 0;
        color: #1976D2;
        border-bottom: none;
      }
      
      #element-inspector-ui .export-info code {
        background: #fff;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 12px;
      }
    `;
    document.head.appendChild(styleEl);
  };

  console.log("Part 1 loaded: UI Framework");
})();

// Recursive Element Analyzer - Part 2: Inspection & Analysis Functions
(function() {
  // Inspection functions
  window.rea.startInspecting = function() {
    window.rea.inspectMode = true;
    document.body.style.cursor = 'crosshair';

    // Add hover effect
    document.addEventListener('mouseover', window.rea.highlightElement);
    document.addEventListener('mouseout', window.rea.removeHighlight);
    document.addEventListener('click', window.rea.selectElement);
  };

  window.rea.stopInspecting = function() {
    window.rea.inspectMode = false;
    document.body.style.cursor = '';

    document.removeEventListener('mouseover', window.rea.highlightElement);
    document.removeEventListener('mouseout', window.rea.removeHighlight);
    document.removeEventListener('click', window.rea.selectElement);

    if (window.rea.highlightedElement) {
      window.rea.highlightedElement.style.outline = window.rea.originalOutline;
      window.rea.highlightedElement = null;
    }
  };

  window.rea.highlightElement = function(e) {
    if (!window.rea.inspectMode) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.target.id === 'element-inspector-ui' || document.getElementById('element-inspector-ui')?.contains(e.target)) {
      return;
    }

    if (window.rea.highlightedElement) {
      window.rea.highlightedElement.style.outline = window.rea.originalOutline;
    }

    window.rea.highlightedElement = e.target;
    window.rea.originalOutline = window.rea.highlightedElement.style.outline;
    window.rea.highlightedElement.style.outline = '2px solid red';
  };

  window.rea.removeHighlight = function(e) {
    if (!window.rea.inspectMode || !window.rea.highlightedElement) return;

    if (e.target === window.rea.highlightedElement) {
      window.rea.highlightedElement.style.outline = window.rea.originalOutline;
      window.rea.highlightedElement = null;
    }
  };

  window.rea.selectElement = function(e) {
    if (!window.rea.inspectMode) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.target.id === 'element-inspector-ui' || document.getElementById('element-inspector-ui')?.contains(e.target)) {
      return;
    }

    const rootElement = e.target;
    window.rea.stopInspecting();

    // Generate CSS selector for the element
    const selector = window.rea.generateSelector(rootElement);
    window.rea.selectorInput.value = selector;

    // Analyze the element tree
    window.rea.analyzeElementTree(rootElement, selector);
  };

  // Selector & Analysis functions
  window.rea.generateSelector = function(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    let selector = element.tagName.toLowerCase();

    if (element.className) {
      const classes = Array.from(element.classList).join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }

    return selector;
  };

  window.rea.collectElements = function(rootElement, maxDepth) {
    const elements = [rootElement];
    
    // Helper function to recursively collect elements
    const collectChildElements = (element, currentDepth) => {
      if (currentDepth >= maxDepth) return;
      
      Array.from(element.children).forEach(child => {
        elements.push(child);
        collectChildElements(child, currentDepth + 1);
      });
    };
    
    collectChildElements(rootElement, 0);
    return elements;
  };

  window.rea.analyzeElementStructure = function(element, selector) {
    // Store basic element information
    const elementInfo = {
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      classes: Array.from(element.classList),
      attributes: Array.from(element.attributes)
        .filter(attr => attr.name !== 'id' && attr.name !== 'class')
        .map(attr => ({ name: attr.name, value: attr.value })),
      dimensions: {
        width: element.offsetWidth,
        height: element.offsetHeight
      },
      position: {
        top: element.offsetTop,
        left: element.offsetLeft
      },
      children: element.children.length,
      textContent: element.textContent.trim()
    };
    
    // Store in analysis cache
    window.rea.analyzedElements.set(element, {
      selector: selector,
      info: elementInfo,
      css: {},
      js: {}
    });
  };

  // Calculate specificity of a selector (simple implementation)
  window.rea.calculateSpecificity = function(selector) {
    try {
      let specificity = 0;
      
      // Count IDs (#)
      const idCount = (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length;
      // Count classes (.) and attributes ([attr])
      const classCount = (selector.match(/\.[a-zA-Z0-9_-]+|\[[^\]]+\]/g) || []).length;
      // Count elements
      const elementCount = (selector.match(/[a-zA-Z0-9_-]+/g) || []).length - idCount - classCount;
      
      // Calculate specificity value (simple approximation)
      specificity = idCount * 100 + classCount * 10 + elementCount;
      
      return specificity;
    } catch (e) {
      console.error('Error calculating specificity:', e);
      return 0;
    }
  };

  // Enhanced CSS Analysis Functions
  window.rea.findCSS = function(selector, element) {
    try {
      // Get element data from cache
      const elementData = window.rea.analyzedElements.get(element);
      if (!elementData) return;
      
      // Initialize CSS data
      elementData.css = {
        applied: {}, // CSS rules directly matching this element
        inherited: {}, // CSS rules inherited from ancestors
        computed: {}, // Computed final styles
        customProperties: {}, // CSS custom properties (variables)
        shadowDOM: {} // Shadow DOM styles if applicable
      };
      
      // Get all stylesheets
      const styleSheets = Array.from(document.styleSheets);
      
      // 1. Collect direct CSS rules
      styleSheets.forEach(sheet => {
        try {
          // Skip if it's a cross-origin stylesheet
          if (sheet.href && !sheet.href.startsWith(window.location.origin) && !sheet.href.startsWith('data:')) {
            return;
          }
          
          const rules = Array.from(sheet.cssRules || []);
          const sourceName = sheet.href || 'inline';
          
          rules.forEach(rule => {
            window.rea.processStyleRule(rule, element, elementData.css.applied, sourceName);
          });
        } catch (e) {
          // Handle CORS errors - skip this stylesheet
        }
      });
      
      // 2. Collect inherited CSS rules from parent elements
      let parent = element.parentElement;
      const processedParents = new Set();
      
      while (parent && !processedParents.has(parent)) {
        processedParents.add(parent);
        const parentKey = `${parent.tagName.toLowerCase()}${parent.id ? '#'+parent.id : ''}${parent.className ? '.'+parent.className.replace(/ /g, '.') : ''}`;
        
        // Get computed style of parent
        const parentStyle = window.getComputedStyle(parent);
        const inheritableStyles = {};
        
        // Check for inheritable properties
        window.rea.inheritableProperties.forEach(prop => {
          if (parentStyle[prop] && parentStyle[prop] !== 'initial') {
            inheritableStyles[prop] = parentStyle[prop];
          }
        });
        
        // Add to inherited styles if any properties were found
        if (Object.keys(inheritableStyles).length > 0) {
          if (!elementData.css.inherited[parentKey]) {
            elementData.css.inherited[parentKey] = [];
          }
          
          elementData.css.inherited[parentKey].push({
            element: parent,
            styles: inheritableStyles
          });
        }
        
        // Move up to the next parent
        parent = parent.parentElement;
      }
      
      // 3. Collect computed styles
      const computedStyle = window.getComputedStyle(element);
      elementData.css.computed = {};
      
      // Get all computed style properties
      for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i];
        elementData.css.computed[prop] = computedStyle.getPropertyValue(prop);
      }
      
      // 4. Collect CSS custom properties (variables) if enabled
      if (window.rea.settings?.includeCSSVariables) {
        window.rea.collectCSSVariables(element, elementData);
      }
      
      // 5. Analyze Shadow DOM styles if present
      if (element.shadowRoot) {
        window.rea.analyzeShadowDOM(element, elementData);
      }
      
    } catch (e) {
      console.error('Error finding CSS:', e);
    }
  };
  
  // Collect CSS custom properties (variables)
  window.rea.collectCSSVariables = function(element, elementData) {
    try {
      const computedStyle = window.getComputedStyle(element);
      const customProperties = {};
      
      // Get all available CSS custom properties
      for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i];
        if (prop.startsWith('--')) {
          const value = computedStyle.getPropertyValue(prop);
          if (value.trim()) {
            customProperties[prop] = value.trim();
          }
        }
      }
      
      // Also check for CSS variables in the element's style attribute
      if (element.style) {
        for (let i = 0; i < element.style.length; i++) {
          const prop = element.style[i];
          if (prop.startsWith('--')) {
            customProperties[prop] = element.style.getPropertyValue(prop);
          }
        }
      }
      
      // Look for CSS variables in stylesheets that might affect this element
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach(sheet => {
        try {
          if (sheet.href && !sheet.href.startsWith(window.location.origin) && !sheet.href.startsWith('data:')) {
            return;
          }
          
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            if (rule.type === CSSRule.STYLE_RULE) {
              const cssText = rule.cssText;
              const variableMatches = cssText.match(/--[a-zA-Z0-9-_]+:\s*[^;]+/g);
              
              if (variableMatches && element.matches(rule.selectorText)) {
                variableMatches.forEach(match => {
                  const [prop, value] = match.split(':').map(s => s.trim());
                  if (prop && value) {
                    customProperties[prop] = value.replace(/;$/, '');
                  }
                });
              }
            }
          });
        } catch (e) {
          // Skip CORS protected stylesheets
        }
      });
      
      elementData.css.customProperties = customProperties;
    } catch (e) {
      console.error('Error collecting CSS variables:', e);
    }
  };
  
  // Analyze Shadow DOM styles
  window.rea.analyzeShadowDOM = function(element, elementData) {
    try {
      const shadowRoot = element.shadowRoot;
      if (!shadowRoot) return;
      
      const shadowStyles = {
        adoptedStyleSheets: [],
        inlineStyles: [],
        styleElements: []
      };
      
      // Check for adopted stylesheets (if supported)
      if (shadowRoot.adoptedStyleSheets && shadowRoot.adoptedStyleSheets.length > 0) {
        shadowRoot.adoptedStyleSheets.forEach((sheet, index) => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            const sheetRules = [];
            
            rules.forEach(rule => {
              if (rule.type === CSSRule.STYLE_RULE) {
                sheetRules.push({
                  selector: rule.selectorText,
                  cssText: rule.cssText
                });
              }
            });
            
            shadowStyles.adoptedStyleSheets.push({
              index: index,
              rules: sheetRules
            });
          } catch (e) {
            // Skip if unable to access stylesheet
          }
        });
      }
      
      // Check for style elements within shadow DOM
      const styleElements = shadowRoot.querySelectorAll('style');
      styleElements.forEach((styleEl, index) => {
        shadowStyles.styleElements.push({
          index: index,
          content: styleEl.textContent
        });
      });
      
      // Check for elements with inline styles in shadow DOM
      const elementsWithStyles = shadowRoot.querySelectorAll('[style]');
      elementsWithStyles.forEach((el, index) => {
        shadowStyles.inlineStyles.push({
          index: index,
          selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.replace(/\s+/g, '.') : ''),
          styles: el.style.cssText
        });
      });
      
      elementData.css.shadowDOM = shadowStyles;
    } catch (e) {
      console.error('Error analyzing Shadow DOM:', e);
    }
  };

  // Helper function to process style rules (including nested rules like media queries)
  window.rea.processStyleRule = function(rule, element, cssCollection, sourceName) {
    // Check if it's a style rule
    if (rule.type === CSSRule.STYLE_RULE) {
      const selectorText = rule.selectorText;
      
      // Check if selector matches our element
      try {
        if (element.matches(selectorText)) {
          if (!cssCollection[sourceName]) {
            cssCollection[sourceName] = [];
          }
          
          cssCollection[sourceName].push({
            selector: selectorText,
            cssText: rule.cssText,
            specificity: window.rea.calculateSpecificity(selectorText)
          });
        }
      } catch (e) {
        // Skip invalid selectors
      }
    }
    // Check for media queries
    else if (rule.type === CSSRule.MEDIA_RULE) {
      const mediaRules = Array.from(rule.cssRules);
      const mediaSource = `${sourceName} (Media: ${rule.conditionText})`;
      
      mediaRules.forEach(mediaRule => {
        window.rea.processStyleRule(mediaRule, element, cssCollection, mediaSource);
      });
    }
    // Support rules and other rule types
    else if (rule.cssRules) {
      try {
        Array.from(rule.cssRules).forEach(nestedRule => {
          window.rea.processStyleRule(nestedRule, element, cssCollection, mediaSource);
        });
      } catch (e) {
        // Skip rules that can't be processed
      }
    }
  };

  window.rea.findJavaScript = function(selector, element) {
    try {
      // Get element data from cache
      const elementData = window.rea.analyzedElements.get(element);
      if (!elementData) return;
      
      // Initialize JS data
      elementData.js = {
        eventListeners: [],
        references: [],
        frameworks: [],
        apiCalls: []
      };
      
      // Check for inline event handlers
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          elementData.js.eventListeners.push({
            event: attr.name.slice(2),
            handler: attr.value,
            type: 'inline',
            source: 'HTML attribute'
          });
        }
      });
      
      // Enhanced search terms generation
      const searchTerms = window.rea.generateSearchTerms(element);
      
      if (searchTerms.length === 0) return;
      
      // Search in various JavaScript sources
      window.rea.searchInlineScripts(elementData, searchTerms);
      window.rea.searchGlobalScope(elementData, searchTerms);
      window.rea.detectFrameworkUsage(elementData, element);
      window.rea.detectAPIUsage(elementData, searchTerms);
      
    } catch (e) {
      console.error('Error finding JavaScript:', e);
    }
  };
  
  // Enhanced search terms generation
  window.rea.generateSearchTerms = function(element) {
    const searchTerms = [];
    
    // Get ID if it exists
    if (element.id) {
      searchTerms.push(element.id);
      searchTerms.push(`#${element.id}`);
      searchTerms.push(`"${element.id}"`);
      searchTerms.push(`'${element.id}'`);
      searchTerms.push(`getElementById('${element.id}')`);
      searchTerms.push(`getElementById("${element.id}")`);
    }
    
    // Get classes if they exist
    if (element.classList.length > 0) {
      element.classList.forEach(cls => {
        searchTerms.push(cls);
        searchTerms.push(`.${cls}`);
        searchTerms.push(`"${cls}"`);
        searchTerms.push(`'${cls}'`);
        searchTerms.push(`getElementsByClassName('${cls}')`);
        searchTerms.push(`getElementsByClassName("${cls}")`);
        searchTerms.push(`querySelectorAll('.${cls}')`);
        searchTerms.push(`querySelector('.${cls}')`);
      });
    }
    
    // Add data attributes if they exist
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .forEach(attr => {
        searchTerms.push(attr.name);
        searchTerms.push(`[${attr.name}]`);
        searchTerms.push(`${attr.name}="${attr.value}"`);
        searchTerms.push(`${attr.name}='${attr.value}'`);
        searchTerms.push(`getAttribute('${attr.name}')`);
        searchTerms.push(`dataset.${attr.name.replace('data-', '')}`);
      });
    
    // Add ARIA attributes
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'))
      .forEach(attr => {
        searchTerms.push(attr.name);
        searchTerms.push(`[${attr.name}]`);
        searchTerms.push(`getAttribute('${attr.name}')`);
      });
    
    // Get element tag name if it's something specific
    const commonTags = ['div', 'span', 'p', 'a', 'img', 'ul', 'li', 'table', 'tr', 'td'];
    if (!commonTags.includes(element.tagName.toLowerCase())) {
      searchTerms.push(element.tagName.toLowerCase());
      searchTerms.push(`<${element.tagName.toLowerCase()}`);
      searchTerms.push(`getElementsByTagName('${element.tagName.toLowerCase()}')`);
    }
    
    // Add name attribute for form elements
    if (element.name) {
      searchTerms.push(element.name);
      searchTerms.push(`name="${element.name}"`);
      searchTerms.push(`[name="${element.name}"]`);
    }
    
    // Remove duplicates and empty strings
    return [...new Set(searchTerms)].filter(term => term.trim() !== '');
  };
  
  // Search in inline scripts
  window.rea.searchInlineScripts = function(elementData, searchTerms) {
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'));
    
    inlineScripts.forEach((script, index) => {
      const scriptContent = script.textContent;
      
      searchTerms.forEach(term => {
        if (scriptContent.includes(term)) {
          // Find all occurrences of the term
          let searchIndex = 0;
          while (true) {
            const termIndex = scriptContent.indexOf(term, searchIndex);
            if (termIndex === -1) break;
            
            // Extract context around the term
            const contextSize = window.rea.settings?.jsContextSize || 300;
            const start = Math.max(0, termIndex - contextSize);
            const end = Math.min(scriptContent.length, termIndex + term.length + contextSize);
            let context = scriptContent.substring(start, end);
            
            // Add ellipsis if truncated
            if (start > 0) context = '...' + context;
            if (end < scriptContent.length) context += '...';
            
            elementData.js.references.push({
              source: `Inline Script #${index + 1}`,
              term: term,
              code: context,
              type: 'inline-script'
            });
            
            searchIndex = termIndex + 1;
          }
        }
      });
    });
  };
  
  // Search in global scope for dynamic event listeners
  window.rea.searchGlobalScope = function(elementData, searchTerms) {
    if (!window.rea.settings?.enableExtendedSearch) return;
    
    try {
      // Check for jQuery usage
      if (window.jQuery || window.$) {
        searchTerms.forEach(term => {
          // Common jQuery patterns
          const jqueryPatterns = [
            `$("${term}")`,
            `$('${term}')`,
            `jQuery("${term}")`,
            `jQuery('${term}')`
          ];
          
          jqueryPatterns.forEach(pattern => {
            elementData.js.references.push({
              source: 'jQuery Detection',
              term: term,
              code: `${pattern} // jQuery selector detected`,
              type: 'framework-usage'
            });
          });
        });
      }
      
      // Check for addEventListener calls (common pattern for IDs)
      searchTerms.forEach(term => {
        if (term.startsWith('#')) {
          const id = term.slice(1);
          elementData.js.references.push({
            source: 'Event Listener Pattern',
            term: term,
            code: `document.getElementById('${id}').addEventListener('event', handler)`,
            type: 'event-pattern'
          });
        }
      });
      
    } catch (e) {
      // Silently fail for global scope access issues
    }
  };
  
  // Detect framework usage
  window.rea.detectFrameworkUsage = function(elementData, element) {
    const frameworks = [];
    
    // React detection
    if (element._reactInternalFiber || element._reactInternals || element.__reactInternalInstance) {
      frameworks.push({
        name: 'React',
        evidence: 'React internal properties found',
        type: 'component-framework'
      });
    }
    
    // Vue detection
    if (element.__vue__ || element._vnode) {
      frameworks.push({
        name: 'Vue.js',
        evidence: 'Vue internal properties found',
        type: 'component-framework'
      });
    }
    
    // Angular detection
    if (element.ng || element.classList.contains('ng-scope') || element.hasAttribute('ng-app')) {
      frameworks.push({
        name: 'Angular',
        evidence: 'Angular attributes or properties found',
        type: 'component-framework'
      });
    }
    
    // Alpine.js detection
    if (Array.from(element.attributes).some(attr => attr.name.startsWith('x-'))) {
      frameworks.push({
        name: 'Alpine.js',
        evidence: 'Alpine.js directives found',
        type: 'component-framework'
      });
    }
    
    elementData.js.frameworks = frameworks;
  };
  
  // Detect API usage patterns
  window.rea.detectAPIUsage = function(elementData, searchTerms) {
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'));
    const apiPatterns = [
      /fetch\s*\(/g,
      /XMLHttpRequest/g,
      /axios\./g,
      /\$\.ajax/g,
      /\$\.get/g,
      /\$\.post/g,
      /addEventListener\s*\(/g,
      /removeEventListener\s*\(/g
    ];
    
    inlineScripts.forEach((script, index) => {
      const scriptContent = script.textContent;
      
      apiPatterns.forEach(pattern => {
        const matches = scriptContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const matchIndex = scriptContent.indexOf(match);
            const contextSize = 150;
            const start = Math.max(0, matchIndex - contextSize);
            const end = Math.min(scriptContent.length, matchIndex + match.length + contextSize);
            let context = scriptContent.substring(start, end);
            
            if (start > 0) context = '...' + context;
            if (end < scriptContent.length) context += '...';
            
            elementData.js.apiCalls.push({
              source: `Inline Script #${index + 1}`,
              api: match,
              code: context,
              type: 'api-usage'
            });
          });
        }
      });
    });
  };

  // Architecture Analysis - Extract complete site files
  window.rea.performArchitectureAnalysis = function(element, selector) {
    // For architecture mode, we only need to analyze the structure once
    // and then extract all site files - not per element
    if (!window.rea.architectureData) {
      window.rea.architectureData = {
        structure: null,
        css: new Set(),
        js: new Set(),
        analyzed: false
      };
    }
    
    // Only perform the heavy lifting once
    if (!window.rea.architectureData.analyzed) {
      window.rea.extractSiteArchitecture(element, selector);
      window.rea.architectureData.analyzed = true;
    }
    
    // For subsequent elements, just add to structure reference
    window.rea.analyzeElementStructure(element, selector);
  };

  // Extract complete site architecture
  window.rea.extractSiteArchitecture = function(rootElement, rootSelector) {
    const progressStatus = document.querySelector('.progress-status');
    
    if (progressStatus) {
      progressStatus.textContent = 'Extracting site architecture...';
    }
    
    // Extract all CSS files and rules
    window.rea.extractAllCSS();
    
    // Extract all JavaScript files
    window.rea.extractAllJavaScript();
    
    // Create architecture summary in structure tab
    window.rea.displayArchitectureSummary(rootElement, rootSelector);
  };

  // Extract all CSS from the page
  window.rea.extractAllCSS = function() {
    const allCSS = {
      external: [],
      inline: [],
      computed: []
    };
    
    // 1. External stylesheets
    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach((sheet, index) => {
      try {
        if (sheet.href) {
          // External stylesheet
          const rules = Array.from(sheet.cssRules || []);
          allCSS.external.push({
            href: sheet.href,
            rules: rules.map(rule => rule.cssText).join('\n'),
            ruleCount: rules.length
          });
        } else {
          // Inline stylesheet
          const rules = Array.from(sheet.cssRules || []);
          allCSS.inline.push({
            source: `<style> block #${index + 1}`,
            rules: rules.map(rule => rule.cssText).join('\n'),
            ruleCount: rules.length
          });
        }
      } catch (e) {
        // CORS blocked external stylesheet
        if (sheet.href) {
          allCSS.external.push({
            href: sheet.href,
            rules: '/* CORS blocked - external stylesheet not accessible */',
            ruleCount: 0,
            blocked: true
          });
        }
      }
    });
    
    // 2. Inline styles from style attributes
    const elementsWithInlineStyles = document.querySelectorAll('[style]');
    const inlineStyles = Array.from(elementsWithInlineStyles).map(el => ({
      selector: window.rea.generateSelector(el),
      style: el.getAttribute('style')
    }));
    
    if (inlineStyles.length > 0) {
      allCSS.inline.push({
        source: 'Inline style attributes',
        rules: inlineStyles.map(item => `${item.selector} { ${item.style} }`).join('\n'),
        ruleCount: inlineStyles.length
      });
    }
    
    window.rea.architectureData.css = allCSS;
  };

  // Extract all JavaScript from the page
  window.rea.extractAllJavaScript = function() {
    const allJS = {
      external: [],
      inline: []
    };
    
    // 1. External scripts
    const externalScripts = Array.from(document.querySelectorAll('script[src]'));
    externalScripts.forEach(script => {
      allJS.external.push({
        src: script.src,
        async: script.async,
        defer: script.defer,
        type: script.type || 'text/javascript',
        blocked: true // We can't access external script content due to CORS
      });
    });
    
    // 2. Inline scripts
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'));
    inlineScripts.forEach((script, index) => {
      const content = script.textContent || script.innerHTML;
      if (content.trim()) {
        allJS.inline.push({
          source: `Inline Script #${index + 1}`,
          content: content,
          type: script.type || 'text/javascript',
          size: content.length
        });
      }
    });
    
    window.rea.architectureData.js = allJS;
  };

  // Display architecture analysis summary
  window.rea.displayArchitectureSummary = function(rootElement, rootSelector) {
    const structureContainer = window.rea.contentElements.structure;
    
    // Clear existing content
    structureContainer.innerHTML = '';
    
    // Create architecture overview
    const overview = document.createElement('div');
    overview.innerHTML = `
      <h3>🏗️ Site Architecture Analysis</h3>
      <p><strong>Target Element:</strong> ${rootSelector}</p>
      
      <div class="architecture-stats">
        <div class="stat-group">
          <h4>📄 CSS Resources</h4>
          <p>External Stylesheets: ${window.rea.architectureData.css.external.length}</p>
          <p>Inline Styles: ${window.rea.architectureData.css.inline.length}</p>
          <p>Total CSS Rules: ${window.rea.architectureData.css.external.reduce((sum, sheet) => sum + sheet.ruleCount, 0) + window.rea.architectureData.css.inline.reduce((sum, style) => sum + style.ruleCount, 0)}</p>
        </div>
        
        <div class="stat-group">
          <h4>⚡ JavaScript Resources</h4>
          <p>External Scripts: ${window.rea.architectureData.js.external.length}</p>
          <p>Inline Scripts: ${window.rea.architectureData.js.inline.length}</p>
          <p>Total Inline Code: ${window.rea.architectureData.js.inline.reduce((sum, script) => sum + script.size, 0)} characters</p>
        </div>
      </div>
      
      <div class="export-info">
        <h4>📁 Export Structure</h4>
        <p>Architecture mode will export:</p>
        <ul>
          <li><code>css/framework.css</code> - All external stylesheets</li>
          <li><code>css/inline.css</code> - All inline styles</li>
          <li><code>js/external-refs.md</code> - External script references</li>
          <li><code>js/inline.js</code> - All inline JavaScript</li>
          <li><code>html-structure.html</code> - Target element structure</li>
          <li><code>analysis-guide.md</code> - Correlation instructions</li>
        </ul>
      </div>
    `;
    
    structureContainer.appendChild(overview);
    
    // Add element structure for reference
    const structureHeading = document.createElement('h4');
    structureHeading.textContent = 'HTML Structure Reference';
    structureContainer.appendChild(structureHeading);
    
    const treeContainer = document.createElement('div');
    treeContainer.className = 'element-tree-container';
    structureContainer.appendChild(treeContainer);
    
    // Show the target element structure  
    window.rea.buildElementTree(rootElement, treeContainer, 5); // Limit depth for architecture view
  };

  window.rea.analyzeElementTree = function(rootElement, selector) {
    // Clear all content areas and reset analysis cache
    Object.values(window.rea.contentElements).forEach(content => {
      content.innerHTML = '';
    });
    window.rea.analyzedElements.clear();
    window.rea.selectedElement = null;

    // Add progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.innerHTML = `
      <div class="progress-status">Analyzing elements...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    `;
    window.rea.contentElements.structure.appendChild(progressContainer);
    
    const progressStatus = progressContainer.querySelector('.progress-status');
    const progressFill = progressContainer.querySelector('.progress-fill');

    // Get analysis depth
    const depth = window.rea.depthSelect.value;
    const maxDepth = depth === 'all' ? Infinity : parseInt(depth, 10);
    
    // Get analysis mode
    const mode = window.rea.modeSelect.value;

    // Create heading for the structure tab
    const structureHeading = document.createElement('h4');
    structureHeading.textContent = 'Element Structure';
    window.rea.contentElements.structure.appendChild(structureHeading);

    // Create structure tree container
    const treeContainer = document.createElement('div');
    treeContainer.className = 'element-tree-container';
    window.rea.contentElements.structure.appendChild(treeContainer);

    // Run analysis in a non-blocking way using requestAnimationFrame
    requestAnimationFrame(() => {
      // Start recursive analysis
      const analysisStart = performance.now();
      
      // Collect all elements that will be analyzed
      const allElements = window.rea.collectElements(rootElement, maxDepth);
      let processedCount = 0;
      const totalElements = allElements.length;
      
      // Update progress bar
      const updateProgress = () => {
        const percent = (processedCount / totalElements) * 100;
        progressFill.style.width = `${percent}%`;
        progressStatus.textContent = `Analyzing elements... ${processedCount}/${totalElements}`;
      };
      
      // Process in chunks to avoid blocking UI
      const processChunk = (elements, startIndex, chunkSize) => {
        const endIndex = Math.min(startIndex + chunkSize, elements.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const el = elements[i];
          const elSelector = window.rea.generateSelector(el);
          
          // Analyze element based on mode
          if (mode === 'architecture') {
            // Architecture mode: extract complete site files + structure reference
            window.rea.performArchitectureAnalysis(el, elSelector);
          } else {
            // Standard analysis modes
            if (mode === 'full' || mode === 'structure' || mode === 'structure-css') {
              window.rea.analyzeElementStructure(el, elSelector);
            }
            
            if (mode === 'full' || mode === 'css' || mode === 'structure-css') {
              window.rea.findCSS(elSelector, el);
            }
            
            if (mode === 'full' || mode === 'js') {
              window.rea.findJavaScript(elSelector, el);
            }
          }
          
          processedCount++;
        }
        
        updateProgress();
        
        if (endIndex < elements.length) {
          // Process next chunk
          setTimeout(() => {
            processChunk(elements, endIndex, chunkSize);
          }, 0);
        } else {
          // All elements processed
          const analysisEnd = performance.now();
          const analysisTime = ((analysisEnd - analysisStart) / 1000).toFixed(2);
          
          // Remove progress indicator
          window.rea.contentElements.structure.removeChild(progressContainer);
          
          // Build and display the element tree
          window.rea.buildElementTree(rootElement, treeContainer, maxDepth);
          
          // Generate summary
          window.rea.generateSummary(rootElement, analysisTime);
          
          // Show notification
          alert(`Analysis complete! Analyzed ${totalElements} elements in ${analysisTime} seconds.`);
        }
      };
      
      // Start processing in chunks of 10 elements
      processChunk(allElements, 0, 10);
    });
  };

  console.log("Part 2 loaded: Analysis Functions");
})();

// Recursive Element Analyzer - Part 3: Display & Export Functions
(function() {
  // Settings management
  window.rea.updateSetting = function(key, value) {
    if (window.rea.settings.hasOwnProperty(key)) {
      window.rea.settings[key] = value;
      console.log(`Setting updated: ${key} = ${value}`);
    } else {
      console.warn(`Unknown setting: ${key}`);
    }
  };
  
  window.rea.getSettings = function() {
    return { ...window.rea.settings };
  };
  
  window.rea.resetSettings = function() {
    window.rea.settings = {
      maxDisplayDepth: 10,
      maxTextLength: 500,
      maxChildrenDisplay: 50,
      maxExportChildren: 1000,
      maxExportSize: 1000000,
      jsContextSize: 300,
      enableExtendedSearch: true,
      includeCSSVariables: true,
      includeInheritedStyles: true,
      includeJavaScript: true,
      structureAndCSSOnly: false
    };
    console.log('Settings reset to defaults');
  };

  // Build element tree for display
  window.rea.buildElementTree = function(rootElement, container, maxDepth) {
    // Create tree root
    const rootNode = document.createElement('div');
    rootNode.className = 'tree-node';
    
    // Get element info
    const elementData = window.rea.analyzedElements.get(rootElement);
    if (!elementData) return;
    
    const info = elementData.info;
    
    // Create node content
    const nodeContent = document.createElement('div');
    nodeContent.className = 'tree-node-content';
    nodeContent.dataset.element = elementData.selector;
    
    // Add click handler to select this element
    nodeContent.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove selection from previously selected node
      const prevSelected = document.querySelector('.tree-node-content.selected');
      if (prevSelected) {
        prevSelected.classList.remove('selected');
      }
      
      // Add selection to this node
      nodeContent.classList.add('selected');
      
      // Set selected element
      window.rea.selectedElement = rootElement;
      
      // Display details for this element
      window.rea.displayElementDetails(rootElement);
    });
    
    // Create node HTML
    let nodeHtml = '';
    
    // Add toggle if element has children
    if (rootElement.children.length > 0) {
      nodeHtml += `<span class="tree-toggle expanded">▶</span>`;
    }
    
    // Add tag name
    nodeHtml += `<span class="tree-node-tag">${info.tag}</span>`;
    
    // Add ID if exists
    if (info.id) {
      nodeHtml += `<span class="tree-node-id">#${info.id}</span>`;
    }
    
    // Add classes if exist
    if (info.classes.length > 0) {
      nodeHtml += `<span class="tree-node-class">.${info.classes.join('.')}</span>`;
    }
    
    // Add text preview if exists
    if (info.textContent) {
      const previewText = info.textContent.length > 100 ? info.textContent.substring(0, 100) + '...' : info.textContent;
      nodeHtml += `<span class="tree-node-text">${previewText}</span>`;
    }
    
    nodeContent.innerHTML = nodeHtml;
    rootNode.appendChild(nodeContent);
    
    // Create child tree if depth allows
    if (rootElement.children.length > 0 && maxDepth > 0) {
      const childContainer = document.createElement('div');
      childContainer.className = 'tree-view';
      
      // Add toggle functionality
      const toggle = nodeContent.querySelector('.tree-toggle');
      if (toggle) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          toggle.classList.toggle('expanded');
          childContainer.style.display = childContainer.style.display === 'none' ? 'block' : 'none';
        });
      }
      
      // Add each child recursively
      Array.from(rootElement.children).forEach(child => {
        window.rea.buildElementTree(child, childContainer, maxDepth - 1);
      });
      
      rootNode.appendChild(childContainer);
    }
    
    container.appendChild(rootNode);
    
    // Auto-select root element on first build
    if (!window.rea.selectedElement) {
      nodeContent.classList.add('selected');
      window.rea.selectedElement = rootElement;
      window.rea.displayElementDetails(rootElement);
    }
  };

  // Display element details in tabs
  window.rea.displayElementDetails = function(element) {
    const elementData = window.rea.analyzedElements.get(element);
    if (!elementData) return;
    
    // Update CSS tab
    window.rea.displayCSSDetails(elementData);
    
    // Update JavaScript tab
    window.rea.displayJSDetails(elementData);
  };

  // Enhanced CSS display function
  window.rea.displayCSSDetails = function(elementData) {
    const cssTab = window.rea.contentElements.css;
    cssTab.innerHTML = '<h4>CSS Rules</h4>';
    
    // Check if we have any CSS data
    if (!elementData.css || 
        (Object.keys(elementData.css.applied).length === 0 && 
         Object.keys(elementData.css.inherited).length === 0)) {
      const noCss = document.createElement('p');
      noCss.textContent = 'No specific CSS rules found for this element.';
      cssTab.appendChild(noCss);
      return;
    }
    
    // Create tabs for different CSS views
    const cssViewTabs = document.createElement('div');
    cssViewTabs.className = 'css-view-tabs';
    cssViewTabs.style.cssText = 'display: flex; margin-bottom: 15px; border-bottom: 1px solid #ddd;';
    
    const cssViews = [
      {id: 'applied', text: 'Applied Rules'},
      {id: 'inherited', text: 'Inherited Rules'},
      {id: 'computed', text: 'Computed Styles'},
      {id: 'variables', text: 'CSS Variables'},
      {id: 'shadow', text: 'Shadow DOM'}
    ];
    
    const cssViewContent = {};
    
    cssViews.forEach(view => {
      // Create tab
      const tab = document.createElement('div');
      tab.className = 'css-view-tab';
      tab.dataset.view = view.id;
      tab.textContent = view.text;
      tab.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 3px solid transparent;';
      
      // Create content container
      const content = document.createElement('div');
      content.className = 'css-view-content';
      content.dataset.content = view.id;
      content.style.display = 'none';
      
      // Add click handler
      tab.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.css-view-tab').forEach(t => {
          t.style.borderBottomColor = 'transparent';
          t.style.fontWeight = 'normal';
        });
        tab.style.borderBottomColor = '#2196F3';
        tab.style.fontWeight = 'bold';
        
        // Show content
        Object.values(cssViewContent).forEach(c => {
          c.style.display = 'none';
        });
        content.style.display = 'block';
      });
      
      cssViewTabs.appendChild(tab);
      cssViewContent[view.id] = content;
      cssTab.appendChild(content);
    });
    
    cssTab.insertBefore(cssViewTabs, cssTab.querySelector('.css-view-content'));
    
    // Populate Applied Rules tab
    if (elementData.css.applied) {
      const appliedContent = cssViewContent.applied;
      
      // Sort sources by specificity (most specific first)
      const sortedSources = Object.entries(elementData.css.applied)
        .flatMap(([source, rules]) => rules.map(rule => ({source, rule})))
        .sort((a, b) => b.rule.specificity - a.rule.specificity);
      
      if (sortedSources.length === 0) {
        appliedContent.innerHTML = '<p>No CSS rules directly applied to this element.</p>';
      } else {
        appliedContent.innerHTML = '<h5>CSS Rules Applied to This Element</h5>';
        
        // Group by source for display
        const sourceGroups = {};
        sortedSources.forEach(({source, rule}) => {
          if (!sourceGroups[source]) {
            sourceGroups[source] = [];
          }
          sourceGroups[source].push(rule);
        });
        
        // Display each source group
        Object.entries(sourceGroups).forEach(([source, rules]) => {
          const sourceSection = document.createElement('div');
          sourceSection.className = 'css-section';
          
          const sourceTitle = document.createElement('div');
          sourceTitle.className = 'css-source';
          sourceTitle.textContent = `Source: ${source}`;
          sourceSection.appendChild(sourceTitle);
          
          rules.forEach(rule => {
            const ruleElement = document.createElement('div');
            ruleElement.className = 'css-rule';
            ruleElement.style.marginBottom = '10px';
            
            const selector = document.createElement('div');
            selector.className = 'css-selector';
            selector.textContent = rule.selector;
            selector.style.marginBottom = '5px';
            
            const cssProperties = document.createElement('div');
            cssProperties.className = 'css-property-list';
            
            // Parse CSS text to extract properties
            const cssText = rule.cssText;
            const propertiesMatch = cssText.match(/{([^}]*)}/);
            
            if (propertiesMatch && propertiesMatch[1]) {
              const properties = propertiesMatch[1].split(';').filter(p => p.trim());
              
              properties.forEach(prop => {
                const [name, value] = prop.split(':').map(p => p.trim());
                if (name && value) {
                  const propertyElement = document.createElement('div');
                  propertyElement.innerHTML = `<span class="css-property-name">${name}</span>: <span class="css-property-value">${value}</span>;`;
                  cssProperties.appendChild(propertyElement);
                }
              });
            }
            
            ruleElement.appendChild(selector);
            ruleElement.appendChild(cssProperties);
            sourceSection.appendChild(ruleElement);
          });
          
          appliedContent.appendChild(sourceSection);
        });
      }
    }
    
    // Populate Inherited Rules tab
    if (elementData.css.inherited) {
      const inheritedContent = cssViewContent.inherited;
      
      if (Object.keys(elementData.css.inherited).length === 0) {
        inheritedContent.innerHTML = '<p>No inherited CSS styles affecting this element.</p>';
      } else {
        inheritedContent.innerHTML = '<h5>CSS Properties Inherited from Parent Elements</h5>';
        
        // Display each parent's inherited styles
        Object.entries(elementData.css.inherited).forEach(([parentKey, inheritedRules]) => {
          const parentSection = document.createElement('div');
          parentSection.className = 'css-section';
          
          const parentTitle = document.createElement('div');
          parentTitle.className = 'css-source';
          parentTitle.textContent = `Inherited from: ${parentKey}`;
          parentSection.appendChild(parentTitle);
          
          inheritedRules.forEach(inherited => {
            const stylesElement = document.createElement('div');
            stylesElement.className = 'css-property-list';
            
            // Add each inherited property
            Object.entries(inherited.styles).forEach(([prop, value]) => {
              const propertyElement = document.createElement('div');
              propertyElement.innerHTML = `<span class="css-property-name">${prop}</span>: <span class="css-property-value">${value}</span>;`;
              stylesElement.appendChild(propertyElement);
            });
            
            parentSection.appendChild(stylesElement);
          });
          
          inheritedContent.appendChild(parentSection);
        });
      }
    }
    
    // Populate Computed Styles tab
    if (elementData.css.computed) {
      const computedContent = cssViewContent.computed;
      
      if (Object.keys(elementData.css.computed).length === 0) {
        computedContent.innerHTML = '<p>No computed styles available.</p>';
      } else {
        computedContent.innerHTML = '<h5>Final Computed Styles</h5>';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter properties...';
        searchInput.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;';
        computedContent.appendChild(searchInput);
        
        const propertiesContainer = document.createElement('div');
        propertiesContainer.className = 'computed-properties';
        
        // Group properties by category
        const categories = {
          'Layout': ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'],
          'Box Model': ['margin', 'padding', 'border', 'box-sizing'],
          'Typography': ['font', 'color', 'text', 'line-height', 'letter-spacing'],
          'Background': ['background'],
          'Other': []
        };
        
        const propertyCategories = {};
        
        // Categorize each property
        Object.entries(elementData.css.computed).forEach(([prop, value]) => {
          let category = 'Other';
          
          // Check which category this property belongs to
          for (const [cat, props] of Object.entries(categories)) {
            if (props.some(p => prop.startsWith(p))) {
              category = cat;
              break;
            }
          }
          
          if (!propertyCategories[category]) {
            propertyCategories[category] = [];
          }
          
          propertyCategories[category].push({prop, value});
        });
        
        // Create a section for each category
        Object.entries(propertyCategories).forEach(([category, properties]) => {
          if (properties.length === 0) return;
          
          const categorySection = document.createElement('div');
          categorySection.className = 'css-section';
          
          const categoryTitle = document.createElement('h6');
          categoryTitle.textContent = category;
          categorySection.appendChild(categoryTitle);
          
          const propertiesList = document.createElement('div');
          propertiesList.className = 'css-property-list';
          
          // Sort properties alphabetically
          properties.sort((a, b) => a.prop.localeCompare(b.prop));
          
          // Add each property
          properties.forEach(({prop, value}) => {
            const propertyElement = document.createElement('div');
            propertyElement.className = 'computed-property';
            propertyElement.dataset.property = prop;
            propertyElement.innerHTML = `<span class="css-property-name">${prop}</span>: <span class="css-property-value">${value}</span>;`;
            propertiesList.appendChild(propertyElement);
          });
          
          categorySection.appendChild(propertiesList);
          propertiesContainer.appendChild(categorySection);
        });
        
        computedContent.appendChild(propertiesContainer);
        
        // Add search functionality
        searchInput.addEventListener('input', () => {
          const searchTerm = searchInput.value.toLowerCase();
          
          document.querySelectorAll('.computed-property').forEach(prop => {
            const propertyName = prop.dataset.property.toLowerCase();
            if (searchTerm === '' || propertyName.includes(searchTerm)) {
              prop.style.display = '';
            } else {
              prop.style.display = 'none';
            }
          });
        });
      }
    }
    
    // Populate CSS Variables tab
    if (elementData.css.customProperties) {
      const variablesContent = cssViewContent.variables;
      
      if (Object.keys(elementData.css.customProperties).length === 0) {
        variablesContent.innerHTML = '<p>No CSS custom properties (variables) found for this element.</p>';
      } else {
        variablesContent.innerHTML = '<h5>CSS Custom Properties (Variables)</h5>';
        
        const variablesContainer = document.createElement('div');
        variablesContainer.className = 'css-variables-container';
        
        // Create a table for better organization
        const table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 10px;';
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Variable Name</th><th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Value</th>';
        table.appendChild(headerRow);
        
        // Sort variables alphabetically
        const sortedVariables = Object.entries(elementData.css.customProperties).sort();
        
        sortedVariables.forEach(([varName, value]) => {
          const row = document.createElement('tr');
          row.style.cssText = 'border-bottom: 1px solid #eee;';
          row.innerHTML = `
            <td style="padding: 8px; font-family: monospace; color: #0D47A1; font-weight: bold;">${varName}</td>
            <td style="padding: 8px; font-family: monospace; color: #2E7D32;">${value}</td>
          `;
          table.appendChild(row);
        });
        
        variablesContainer.appendChild(table);
        variablesContent.appendChild(variablesContainer);
      }
    }
    
    // Populate Shadow DOM tab
    if (elementData.css.shadowDOM) {
      const shadowContent = cssViewContent.shadow;
      const shadowData = elementData.css.shadowDOM;
      
      const hasData = (shadowData.adoptedStyleSheets && shadowData.adoptedStyleSheets.length > 0) ||
                     (shadowData.styleElements && shadowData.styleElements.length > 0) ||
                     (shadowData.inlineStyles && shadowData.inlineStyles.length > 0);
      
      if (!hasData) {
        shadowContent.innerHTML = '<p>No Shadow DOM styles found for this element.</p>';
      } else {
        shadowContent.innerHTML = '<h5>Shadow DOM Styles</h5>';
        
        // Adopted stylesheets
        if (shadowData.adoptedStyleSheets && shadowData.adoptedStyleSheets.length > 0) {
          const adoptedHeading = document.createElement('h6');
          adoptedHeading.textContent = 'Adopted Stylesheets';
          shadowContent.appendChild(adoptedHeading);
          
          shadowData.adoptedStyleSheets.forEach((sheet, index) => {
            const sheetElement = document.createElement('div');
            sheetElement.style.cssText = 'margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px;';
            
            const sheetTitle = document.createElement('div');
            sheetTitle.textContent = `Adopted Stylesheet #${index + 1}`;
            sheetTitle.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: #1976D2;';
            sheetElement.appendChild(sheetTitle);
            
            if (sheet.rules && sheet.rules.length > 0) {
              const rulesContainer = document.createElement('pre');
              rulesContainer.style.cssText = 'background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin: 5px 0;';
              
              let cssText = '';
              sheet.rules.forEach(rule => {
                cssText += rule.cssText + '\\n\\n';
              });
              
              rulesContainer.textContent = cssText.trim();
              sheetElement.appendChild(rulesContainer);
            }
            
            shadowContent.appendChild(sheetElement);
          });
        }
        
        // Style elements
        if (shadowData.styleElements && shadowData.styleElements.length > 0) {
          const styleHeading = document.createElement('h6');
          styleHeading.textContent = 'Style Elements';
          shadowContent.appendChild(styleHeading);
          
          shadowData.styleElements.forEach((styleEl, index) => {
            const styleElement = document.createElement('div');
            styleElement.style.cssText = 'margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px;';
            
            const styleTitle = document.createElement('div');
            styleTitle.textContent = `<style> Element #${index + 1}`;
            styleTitle.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: #1976D2;';
            styleElement.appendChild(styleTitle);
            
            const codeElement = document.createElement('pre');
            codeElement.style.cssText = 'background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin: 5px 0;';
            codeElement.textContent = styleEl.content;
            styleElement.appendChild(codeElement);
            
            shadowContent.appendChild(styleElement);
          });
        }
        
        // Inline styles
        if (shadowData.inlineStyles && shadowData.inlineStyles.length > 0) {
          const inlineHeading = document.createElement('h6');
          inlineHeading.textContent = 'Inline Styles';
          shadowContent.appendChild(inlineHeading);
          
          shadowData.inlineStyles.forEach((inlineStyle, index) => {
            const inlineElement = document.createElement('div');
            inlineElement.style.cssText = 'margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px;';
            
            const selectorElement = document.createElement('div');
            selectorElement.textContent = inlineStyle.selector;
            selectorElement.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: #7B1FA2;';
            inlineElement.appendChild(selectorElement);
            
            const codeElement = document.createElement('pre');
            codeElement.style.cssText = 'background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin: 5px 0;';
            codeElement.textContent = inlineStyle.styles;
            inlineElement.appendChild(codeElement);
            
            shadowContent.appendChild(inlineElement);
          });
        }
      }
    }
    
    // Activate first tab by default
    cssViewTabs.querySelector('.css-view-tab').click();
    
    // Add export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-button';
    exportBtn.textContent = 'Export CSS Analysis';
    exportBtn.addEventListener('click', () => {
      window.rea.exportCSSAnalysis(elementData);
    });
    
    cssTab.appendChild(exportBtn);
  };

  // Display JavaScript details
  window.rea.displayJSDetails = function(elementData) {
    const jsTab = window.rea.contentElements.javascript;
    jsTab.innerHTML = '<h4>JavaScript Event Listeners & References</h4>';
    
    const hasData = elementData.js && (
      (elementData.js.eventListeners && elementData.js.eventListeners.length > 0) ||
      (elementData.js.references && elementData.js.references.length > 0) ||
      (elementData.js.frameworks && elementData.js.frameworks.length > 0) ||
      (elementData.js.apiCalls && elementData.js.apiCalls.length > 0)
    );
    
    if (!hasData) {
      const noJs = document.createElement('p');
      noJs.textContent = 'No JavaScript references found for this element.';
      jsTab.appendChild(noJs);
      return;
    }
    
    // Add event listeners section if any
    if (elementData.js.eventListeners && elementData.js.eventListeners.length > 0) {
      const listenersHeading = document.createElement('h5');
      listenersHeading.textContent = 'Event Listeners';
      jsTab.appendChild(listenersHeading);
      
      elementData.js.eventListeners.forEach(listener => {
        const listenerElement = document.createElement('div');
        listenerElement.style.marginBottom = '15px';
        listenerElement.style.border = '1px solid #e0e0e0';
        listenerElement.style.padding = '10px';
        listenerElement.style.borderRadius = '4px';
        
        const eventInfo = document.createElement('div');
        eventInfo.textContent = `Event: ${listener.event}`;
        eventInfo.style.fontWeight = 'bold';
        eventInfo.style.marginBottom = '5px';
        
        const sourceInfo = document.createElement('div');
        sourceInfo.textContent = `Source: ${listener.source || 'HTML attribute'}`;
        sourceInfo.style.fontSize = '12px';
        sourceInfo.style.color = '#666';
        sourceInfo.style.marginBottom = '5px';
        
        const codeElement = document.createElement('pre');
        codeElement.textContent = listener.handler;
        
        listenerElement.appendChild(eventInfo);
        listenerElement.appendChild(sourceInfo);
        listenerElement.appendChild(codeElement);
        jsTab.appendChild(listenerElement);
      });
    }
    
    // Add code references section if any
    if (elementData.js.references && elementData.js.references.length > 0) {
      const referencesHeading = document.createElement('h5');
      referencesHeading.textContent = 'JavaScript References';
      jsTab.appendChild(referencesHeading);
      
      elementData.js.references.forEach(reference => {
        const refElement = document.createElement('div');
        refElement.style.marginBottom = '15px';
        refElement.style.border = '1px solid #e0e0e0';
        refElement.style.padding = '10px';
        refElement.style.borderRadius = '4px';
        
        const sourceInfo = document.createElement('div');
        sourceInfo.textContent = `Source: ${reference.source}`;
        sourceInfo.style.fontWeight = 'bold';
        sourceInfo.style.marginBottom = '5px';
        
        const typeInfo = document.createElement('div');
        typeInfo.textContent = `Type: ${reference.type || 'reference'}`;
        typeInfo.style.fontSize = '12px';
        typeInfo.style.color = '#666';
        typeInfo.style.marginBottom = '5px';
        
        const matchInfo = document.createElement('div');
        if (reference.term && reference.term !== 'N/A') {
          matchInfo.textContent = `Search Term: "${reference.term}"`;
          matchInfo.style.fontStyle = 'italic';
          matchInfo.style.marginBottom = '5px';
          matchInfo.style.fontSize = '12px';
        }
        
        const codeElement = document.createElement('pre');
        codeElement.textContent = reference.code;
        
        refElement.appendChild(sourceInfo);
        refElement.appendChild(typeInfo);
        if (reference.term && reference.term !== 'N/A') {
          refElement.appendChild(matchInfo);
        }
        refElement.appendChild(codeElement);
        jsTab.appendChild(refElement);
      });
    }
    
    // Add framework detection section
    if (elementData.js.frameworks && elementData.js.frameworks.length > 0) {
      const frameworksHeading = document.createElement('h5');
      frameworksHeading.textContent = 'Framework Detection';
      jsTab.appendChild(frameworksHeading);
      
      elementData.js.frameworks.forEach(framework => {
        const frameworkElement = document.createElement('div');
        frameworkElement.style.marginBottom = '10px';
        frameworkElement.style.padding = '8px';
        frameworkElement.style.backgroundColor = '#f0f8ff';
        frameworkElement.style.borderRadius = '4px';
        frameworkElement.style.border = '1px solid #e0e8f0';
        
        const nameElement = document.createElement('strong');
        nameElement.textContent = framework.name;
        nameElement.style.color = '#1976D2';
        
        const evidenceElement = document.createElement('div');
        evidenceElement.textContent = framework.evidence;
        evidenceElement.style.fontSize = '12px';
        evidenceElement.style.color = '#666';
        evidenceElement.style.marginTop = '3px';
        
        frameworkElement.appendChild(nameElement);
        frameworkElement.appendChild(evidenceElement);
        jsTab.appendChild(frameworkElement);
      });
    }
    
    // Add API usage section
    if (elementData.js.apiCalls && elementData.js.apiCalls.length > 0) {
      const apiHeading = document.createElement('h5');
      apiHeading.textContent = 'API Usage Detected';
      jsTab.appendChild(apiHeading);
      
      elementData.js.apiCalls.forEach(apiCall => {
        const apiElement = document.createElement('div');
        apiElement.style.marginBottom = '15px';
        apiElement.style.border = '1px solid #fff3cd';
        apiElement.style.backgroundColor = '#fff3cd';
        apiElement.style.padding = '10px';
        apiElement.style.borderRadius = '4px';
        
        const apiInfo = document.createElement('div');
        apiInfo.textContent = `API: ${apiCall.api}`;
        apiInfo.style.fontWeight = 'bold';
        apiInfo.style.marginBottom = '5px';
        
        const sourceInfo = document.createElement('div');
        sourceInfo.textContent = `Source: ${apiCall.source}`;
        sourceInfo.style.fontSize = '12px';
        sourceInfo.style.color = '#666';
        sourceInfo.style.marginBottom = '5px';
        
        const codeElement = document.createElement('pre');
        codeElement.textContent = apiCall.code;
        codeElement.style.backgroundColor = '#f8f9fa';
        codeElement.style.margin = '0';
        
        apiElement.appendChild(apiInfo);
        apiElement.appendChild(sourceInfo);
        apiElement.appendChild(codeElement);
        jsTab.appendChild(apiElement);
      });
    }
  };

  // Generate summary
  window.rea.generateSummary = function(rootElement, analysisTime) {
    const summaryTab = window.rea.contentElements.summary;
    summaryTab.innerHTML = '<h4>Analysis Summary</h4>';
    
    // Calculate stats
    const stats = window.rea.calculateStats();
    
    // Add analysis info
    const infoContainer = document.createElement('div');
    infoContainer.innerHTML = `
      <p>Root Element: <strong>${window.rea.generateSelector(rootElement)}</strong></p>
      <p>Analysis Time: <strong>${analysisTime} seconds</strong></p>
      <p>Recursion Depth: <strong>${window.rea.depthSelect.value === 'all' ? 'All Children' : window.rea.depthSelect.value}</strong></p>
      <p>Analysis Mode: <strong>${window.rea.modeSelect.value.charAt(0).toUpperCase() + window.rea.modeSelect.value.slice(1)}</strong></p>
    `;
    summaryTab.appendChild(infoContainer);
    
    // Add statistics boxes
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-container';
    
    // Elements analyzed
    const elementsBox = document.createElement('div');
    elementsBox.className = 'stat-box';
    elementsBox.innerHTML = `
      <div class="stat-number">${stats.elements}</div>
      <div class="stat-label">Elements</div>
    `;
    
    // CSS rules found
    const cssBox = document.createElement('div');
    cssBox.className = 'stat-box';
    cssBox.innerHTML = `
      <div class="stat-number">${stats.cssRules}</div>
      <div class="stat-label">CSS Rules</div>
    `;
    
    // JS references found
    const jsBox = document.createElement('div');
    jsBox.className = 'stat-box';
    jsBox.innerHTML = `
      <div class="stat-number">${stats.jsReferences}</div>
      <div class="stat-label">JS References</div>
    `;
    
    statsContainer.appendChild(elementsBox);
    statsContainer.appendChild(cssBox);
    statsContainer.appendChild(jsBox);
    summaryTab.appendChild(statsContainer);
    
    // Add export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-button';
    exportBtn.textContent = 'Export Analysis Report';
    exportBtn.addEventListener('click', () => {
      window.rea.exportAnalysis(stats, analysisTime);
    });
    
    summaryTab.appendChild(exportBtn);
  };

  // Calculate statistics
  window.rea.calculateStats = function() {
    const stats = {
      elements: window.rea.analyzedElements.size,
      cssRules: 0,
      jsReferences: 0,
      selectors: {},
      jsRefs: {}
    };
    
    // Process each analyzed element
    window.rea.analyzedElements.forEach((data, element) => {
      // Count CSS rules
      if (data.css.applied) {
        Object.values(data.css.applied).forEach(rules => {
          stats.cssRules += rules.length;
          
          // Track selector usage
          rules.forEach(rule => {
            if (!stats.selectors[rule.selector]) {
              stats.selectors[rule.selector] = 0;
            }
            stats.selectors[rule.selector]++;
          });
        });
      }
      
      // Count JS references
      if (data.js.eventListeners) {
        stats.jsReferences += data.js.eventListeners.length;
      }
      
      if (data.js.references) {
        stats.jsReferences += data.js.references.length;
        
        // Track JS references by element
        const elementKey = data.info.id || data.info.tag + (data.info.classes.length > 0 ? '.' + data.info.classes[0] : '');
        
        if (!stats.jsRefs[elementKey]) {
          stats.jsRefs[elementKey] = 0;
        }
        stats.jsRefs[elementKey] += data.js.references.length;
      }
    });
    
    // Get top 10 CSS selectors
    stats.topSelectors = Object.entries(stats.selectors)
      .map(([selector, count]) => ({ selector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Get top 10 JS referenced elements
    stats.topJsRefs = Object.entries(stats.jsRefs)
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return stats;
  };

  // Export CSS analysis as markdown file
  window.rea.exportCSSAnalysis = function(elementData) {
    // Create markdown content
    let markdown = `# CSS Analysis for ${elementData.selector}\n\n`;
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    // Get element HTML representation
    const element = window.rea.selectedElement;
    markdown += `## HTML Element\n\n`;
    
    // Get simplified HTML representation
    const htmlOutput = window.rea.getElementHTML(element);
    markdown += "```html\n" + htmlOutput + "\n```\n\n";
    
    // Add applied CSS rules
    markdown += `## Applied CSS Rules\n\n`;
    
    if (elementData.css.applied && Object.keys(elementData.css.applied).length > 0) {
      Object.entries(elementData.css.applied).forEach(([source, rules]) => {
        markdown += `### Source: ${source}\n\n`;
        
        rules.forEach(rule => {
          markdown += `Selector: \`${rule.selector}\`\n\n`;
          
          // Format and add CSS
          const cssText = rule.cssText
            .replace(rule.selector, '')
            .replace('{', '')
            .replace('}', '')
            .trim();
          
          markdown += "```css\n";
          
          // Format properties for readability
          const properties = cssText.split(';').filter(p => p.trim());
          properties.forEach(prop => {
            if (prop.trim()) {
              markdown += prop.trim() + ";\n";
            }
          });
          
          markdown += "```\n\n";
        });
      });
    } else {
      markdown += "No CSS rules directly applied to this element.\n\n";
    }
    
    // Add inherited CSS
    markdown += `## Inherited CSS Properties\n\n`;
    
    if (elementData.css.inherited && Object.keys(elementData.css.inherited).length > 0) {
      Object.entries(elementData.css.inherited).forEach(([parentKey, inheritedRules]) => {
        markdown += `### Inherited from: ${parentKey}\n\n`;
        
        inheritedRules.forEach(inherited => {
          markdown += "```css\n";
          
          // Add each inherited property
          Object.entries(inherited.styles).forEach(([prop, value]) => {
            markdown += `${prop}: ${value};\n`;
          });
          
          markdown += "```\n\n";
        });
      });
    } else {
      markdown += "No inherited CSS properties affecting this element.\n\n";
    }
    
    // Add computed styles section
    markdown += `## Computed Styles\n\n`;
    
    if (elementData.css.computed && Object.keys(elementData.css.computed).length > 0) {
      // Group properties by category
      const categories = {
        'Layout': ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'],
        'Box Model': ['margin', 'padding', 'border', 'box-sizing'],
        'Typography': ['font', 'color', 'text', 'line-height', 'letter-spacing'],
        'Background': ['background'],
        'Other': []
      };
      
      const propertyCategories = {};
      
      // Categorize each property
      Object.entries(elementData.css.computed).forEach(([prop, value]) => {
        let category = 'Other';
        
        // Check which category this property belongs to
        for (const [cat, props] of Object.entries(categories)) {
          if (props.some(p => prop.startsWith(p))) {
            category = cat;
            break;
          }
        }
        
        if (!propertyCategories[category]) {
          propertyCategories[category] = [];
        }
        
        propertyCategories[category].push({prop, value});
      });
      
      // Add each category
      Object.entries(propertyCategories).forEach(([category, properties]) => {
        if (properties.length === 0) return;
        
        markdown += `### ${category}\n\n`;
        markdown += "```css\n";
        
        // Sort properties alphabetically
        properties.sort((a, b) => a.prop.localeCompare(b.prop));
        
        // Add each property
        properties.forEach(({prop, value}) => {
          markdown += `${prop}: ${value};\n`;
        });
        
        markdown += "```\n\n";
      });
    } else {
      markdown += "No computed styles available.\n\n";
    }
    
    // Create timestamp for filename
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Create download link
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `css-analysis_${timestamp}.md`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Show success message
    alert(`CSS analysis exported successfully!`);
  };

  // Helper to get element HTML
  window.rea.getElementHTML = function(element) {
    // Create a clone of the element
    const clone = element.cloneNode(true);
    
    // Helper function to simplify the HTML
    const simplifyHTML = (el, depth = 0) => {
      // Max depth to prevent overwhelming output (configurable)
      const maxDepth = window.rea.settings?.maxDisplayDepth || 10;
      if (depth > maxDepth) {
        return `${' '.repeat(depth * 2)}<${el.tagName.toLowerCase()}>...</${el.tagName.toLowerCase()}>`;
      }
      
      let html = `${' '.repeat(depth * 2)}<${el.tagName.toLowerCase()}`;
      
      // Add id and class attributes
      if (el.id) {
        html += ` id="${el.id}"`;
      }
      
      if (el.className) {
        html += ` class="${el.className}"`;
      }
      
      // Keep only important attributes to reduce noise
      const importantAttrs = ['src', 'href', 'alt', 'title', 'data-', 'aria-', 'role', 'type', 'name', 'value'];
      
      Array.from(el.attributes).forEach(attr => {
        const name = attr.name;
        if (name !== 'id' && name !== 'class' && 
            (importantAttrs.includes(name) || importantAttrs.some(a => name.startsWith(a)))) {
          html += ` ${name}="${attr.value}"`;
        }
      });
      
      html += '>';
      
      // Add content or simplified children
      if (el.children.length === 0) {
        // Include text content (configurable limit)
        let text = el.textContent.trim();
        const maxTextLength = window.rea.settings?.maxTextLength || 200;
        if (text.length > maxTextLength) {
          text = text.substring(0, maxTextLength - 3) + '...';
        }
        if (text) {
          html += text;
        }
        html += `</${el.tagName.toLowerCase()}>`;
      } else {
        html += '\n';
        
        // Limit children to avoid huge outputs (configurable)
        const maxChildren = window.rea.settings?.maxChildrenDisplay || 20;
        const children = Array.from(el.children);
        
        for (let i = 0; i < Math.min(children.length, maxChildren); i++) {
          html += simplifyHTML(children[i], depth + 1) + '\n';
        }
        
        if (children.length > maxChildren) {
          html += `${' '.repeat((depth + 1) * 2)}<!-- ${children.length - maxChildren} more children -->\n`;
        }
        
        html += `${' '.repeat(depth * 2)}</${el.tagName.toLowerCase()}>`;
      }
      
      return html;
    };
    
    return simplifyHTML(clone);
  };

// Export Architecture Analysis - Multiple Files
window.rea.exportArchitectureAnalysis = function(stats, analysisTime) {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '_');
    const baseFileName = `site-architecture_${timestamp}`;
    
    // File 1: Analysis Guide
    const analysisGuide = window.rea.generateAnalysisGuide(stats, analysisTime);
    window.rea.downloadFile(analysisGuide, `${baseFileName}_analysis-guide.md`);
    
    // File 2: HTML Structure Reference
    const htmlStructure = window.rea.generateHTMLStructure();
    window.rea.downloadFile(htmlStructure, `${baseFileName}_html-structure.html`);
    
    // File 3: Complete CSS
    const allCSS = window.rea.generateCompleteCSS();
    window.rea.downloadFile(allCSS, `${baseFileName}_complete-styles.css`);
    
    // File 4: JavaScript References and Inline Code
    const allJS = window.rea.generateCompleteJavaScript();
    window.rea.downloadFile(allJS, `${baseFileName}_javascript-analysis.md`);
    
    // Show completion message
    alert(`Architecture analysis exported as 4 files:\n\n` +
          `1. ${baseFileName}_analysis-guide.md\n` +
          `2. ${baseFileName}_html-structure.html\n` +
          `3. ${baseFileName}_complete-styles.css\n` +
          `4. ${baseFileName}_javascript-analysis.md\n\n` +
          `These files contain the complete site architecture for the target element.`);
};

// Generate analysis guide markdown
window.rea.generateAnalysisGuide = function(stats, analysisTime) {
    let guide = `# Site Architecture Analysis Guide\n\n`;
    guide += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    guide += `## 🎯 Analysis Target\n\n`;
    guide += `**Element Selector:** \`${window.rea.selectorInput.value}\`\n`;
    guide += `**Analysis Time:** ${analysisTime} seconds\n`;
    guide += `**Mode:** Architecture Analysis (Complete Site Extraction)\n\n`;
    
    guide += `## 📊 Architecture Statistics\n\n`;
    if (window.rea.architectureData) {
        const cssStats = window.rea.architectureData.css;
        const jsStats = window.rea.architectureData.js;
        
        guide += `### CSS Resources\n`;
        guide += `- External Stylesheets: ${cssStats.external.length}\n`;
        guide += `- Inline Style Blocks: ${cssStats.inline.length}\n`;
        guide += `- Total CSS Rules: ${cssStats.external.reduce((sum, sheet) => sum + sheet.ruleCount, 0) + cssStats.inline.reduce((sum, style) => sum + style.ruleCount, 0)}\n\n`;
        
        guide += `### JavaScript Resources\n`;
        guide += `- External Scripts: ${jsStats.external.length}\n`;
        guide += `- Inline Scripts: ${jsStats.inline.length}\n`;
        guide += `- Total Inline Code: ${jsStats.inline.reduce((sum, script) => sum + script.size, 0)} characters\n\n`;
    }
    
    guide += `## 📁 File Structure\n\n`;
    guide += `This architecture analysis exports 4 files:\n\n`;
    guide += `1. **analysis-guide.md** - This file with instructions\n`;
    guide += `2. **html-structure.html** - Target element HTML structure\n`;
    guide += `3. **complete-styles.css** - All CSS from the page\n`;
    guide += `4. **javascript-analysis.md** - JavaScript references and inline code\n\n`;
    
    guide += `## 🔧 How to Use This Analysis\n\n`;
    guide += `### Step 1: Study the HTML Structure\n`;
    guide += `Open \`html-structure.html\` to understand the component hierarchy and element relationships.\n\n`;
    
    guide += `### Step 2: Review Complete Styles\n`;
    guide += `The \`complete-styles.css\` file contains ALL CSS rules from the page. You can:\n`;
    guide += `- Search for specific selectors related to your target element\n`;
    guide += `- Identify design system patterns and CSS custom properties\n`;
    guide += `- Extract relevant styles for your component recreation\n\n`;
    
    guide += `### Step 3: Analyze JavaScript Behavior\n`;
    guide += `Review \`javascript-analysis.md\` to understand:\n`;
    guide += `- External script dependencies\n`;
    guide += `- Inline JavaScript functionality\n`;
    guide += `- Framework detection and component behavior\n\n`;
    
    guide += `### Step 4: Correlation Strategy\n`;
    guide += `Use the HTML structure as your map and grep/search the CSS file for:\n`;
    guide += `- Class names from the HTML\n`;
    guide += `- ID selectors\n`;
    guide += `- CSS custom properties (variables)\n`;
    guide += `- Framework-specific patterns\n\n`;
    
    guide += `## 🎨 Recreation Guidelines\n\n`;
    guide += `### CSS Extraction\n`;
    guide += `1. Start with the outermost container selectors from your HTML\n`;
    guide += `2. Search for each class name in the complete CSS\n`;
    guide += `3. Look for CSS custom properties at the top of the file\n`;
    guide += `4. Include any @media queries for responsive behavior\n\n`;
    
    guide += `### JavaScript Dependencies\n`;
    guide += `1. Check external script references for framework dependencies\n`;
    guide += `2. Review inline scripts for component initialization\n`;
    guide += `3. Look for event listeners and interactive behaviors\n\n`;
    
    guide += `## 🔍 Search Patterns\n\n`;
    guide += `When searching the CSS file, try these patterns:\n\n`;
    
    // Add specific class names from the analyzed element if available
    if (window.rea.selectorInput.value) {
        const element = document.querySelector(window.rea.selectorInput.value);
        if (element) {
            const classes = Array.from(element.classList);
            if (classes.length > 0) {
                guide += `### Target Element Classes\n`;
                classes.slice(0, 10).forEach(className => {
                    guide += `- Search for: \`.${className}\`\n`;
                });
                guide += `\n`;
            }
        }
    }
    
    guide += `### General Patterns\n`;
    guide += `- \`:root\` - CSS custom properties/design tokens\n`;
    guide += `- \`@media\` - Responsive breakpoints\n`;
    guide += `- Framework prefixes (e.g., \`.lg:\`, \`.md:\`, \`.v-\`, \`.ng-\`)\n`;
    guide += `- Animation/transition rules\n\n`;
    
    guide += `---\n\n`;
    guide += `**Generated by Recursive Element Analyzer V2** - Architecture Analysis Mode\n`;
    
    return guide;
};

// Generate HTML structure reference
window.rea.generateHTMLStructure = function() {
    const selector = window.rea.selectorInput.value;
    const element = document.querySelector(selector);
    
    if (!element) {
        return `<!DOCTYPE html>\n<html>\n<head>\n<title>HTML Structure Reference</title>\n</head>\n<body>\n<p>Error: Could not find element with selector: ${selector}</p>\n</body>\n</html>`;
    }
    
    // Get clean HTML without scripts and with limited depth
    const cleanHTML = window.rea.getElementHTML(element);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Structure Reference - ${selector}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .analysis-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .html-container { background: #f9f9f9; padding: 15px; border-radius: 5px; overflow-x: auto; }
        pre { margin: 0; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="analysis-info">
        <h1>HTML Structure Reference</h1>
        <p><strong>Target Selector:</strong> <code>${selector}</code></p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Purpose:</strong> Use this HTML structure as a reference map when searching the complete CSS file for relevant styles.</p>
    </div>
    
    <div class="html-container">
        <pre><code>${cleanHTML}</code></pre>
    </div>
</body>
</html>`;
};

// Generate complete CSS file
window.rea.generateCompleteCSS = function() {
    if (!window.rea.architectureData || !window.rea.architectureData.css) {
        return `/* No CSS data available. Please run Architecture Analysis first. */`;
    }
    
    let css = `/* Complete Site CSS - Generated by Recursive Element Analyzer V2 */\n`;
    css += `/* Generated on: ${new Date().toLocaleString()} */\n`;
    css += `/* Target Element: ${window.rea.selectorInput.value} */\n\n`;
    
    const cssData = window.rea.architectureData.css;
    
    // External stylesheets
    if (cssData.external.length > 0) {
        css += `/* ========================================= */\n`;
        css += `/* EXTERNAL STYLESHEETS */\n`;
        css += `/* ========================================= */\n\n`;
        
        cssData.external.forEach((sheet, index) => {
            css += `/* External Stylesheet #${index + 1} */\n`;
            css += `/* Source: ${sheet.href} */\n`;
            if (sheet.blocked) {
                css += `/* CORS BLOCKED - Content not accessible */\n`;
                css += `/* To access: Download manually from ${sheet.href} */\n\n`;
            } else {
                css += `/* Rules: ${sheet.ruleCount} */\n\n`;
                css += sheet.rules + '\n\n';
            }
        });
    }
    
    // Inline styles
    if (cssData.inline.length > 0) {
        css += `/* ========================================= */\n`;
        css += `/* INLINE STYLES */\n`;
        css += `/* ========================================= */\n\n`;
        
        cssData.inline.forEach((styleBlock, index) => {
            css += `/* ${styleBlock.source} */\n`;
            css += `/* Rules: ${styleBlock.ruleCount} */\n\n`;
            css += styleBlock.rules + '\n\n';
        });
    }
    
    css += `/* End of CSS extraction */\n`;
    return css;
};

// Generate JavaScript analysis
window.rea.generateCompleteJavaScript = function() {
    let js = `# JavaScript Analysis Report\n\n`;
    js += `Generated on: ${new Date().toLocaleString()}\n`;
    js += `Target Element: \`${window.rea.selectorInput.value}\`\n\n`;
    
    if (!window.rea.architectureData || !window.rea.architectureData.js) {
        js += `No JavaScript data available. Please run Architecture Analysis first.\n`;
        return js;
    }
    
    const jsData = window.rea.architectureData.js;
    
    // External scripts
    if (jsData.external.length > 0) {
        js += `## External JavaScript Files\n\n`;
        js += `The following external scripts are loaded on this page:\n\n`;
        
        jsData.external.forEach((script, index) => {
            js += `### ${index + 1}. ${script.src}\n\n`;
            js += `- **Type:** ${script.type}\n`;
            js += `- **Async:** ${script.async ? 'Yes' : 'No'}\n`;
            js += `- **Defer:** ${script.defer ? 'Yes' : 'No'}\n`;
            js += `- **Access:** CORS blocked (external file)\n\n`;
            js += `**To analyze:** Download manually from the URL above.\n\n`;
        });
    }
    
    // Inline scripts
    if (jsData.inline.length > 0) {
        js += `## Inline JavaScript Code\n\n`;
        js += `The following scripts are embedded directly in the page:\n\n`;
        
        jsData.inline.forEach((script, index) => {
            js += `### ${script.source}\n\n`;
            js += `- **Type:** ${script.type}\n`;
            js += `- **Size:** ${script.size} characters\n\n`;
            js += `\`\`\`javascript\n${script.content}\n\`\`\`\n\n`;
        });
    }
    
    if (jsData.external.length === 0 && jsData.inline.length === 0) {
        js += `## No JavaScript Found\n\n`;
        js += `No external scripts or inline JavaScript code was detected on this page.\n`;
    }
    
    js += `---\n\n`;
    js += `**Note:** This analysis captures JavaScript at the time of extraction. Dynamic scripts loaded later may not be included.\n`;
    
    return js;
};

// Helper function to download files
window.rea.downloadFile = function(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Specifically fixed exportAnalysis function
window.rea.exportAnalysis = function(stats, analysisTime) {
    console.log("Starting export process");
    
    // Check if we're in architecture mode
    const currentMode = window.rea.modeSelect ? window.rea.modeSelect.value : 'full';
    
    if (currentMode === 'architecture') {
        // Architecture mode: export structured files
        window.rea.exportArchitectureAnalysis(stats, analysisTime);
        return;
    }
    
    // Standard export for other modes
    // Create markdown content
    let markdown = `# Recursive Element Analysis Report\n\n`;
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    // Add analysis info
    markdown += `## Analysis Information\n\n`;
    markdown += `- Root Element: ${window.rea.selectorInput.value}\n`;
    markdown += `- Analysis Time: ${analysisTime} seconds\n`;
    markdown += `- Recursion Depth: ${window.rea.depthSelect.value === 'all' ? 'All Children' : window.rea.depthSelect.value}\n`;
    markdown += `- Elements Analyzed: ${stats.elements}\n`;
    markdown += `- CSS Rules Found: ${stats.cssRules}\n`;
    markdown += `- JavaScript References: ${stats.jsReferences}\n\n`;
    
    // SECTION 1: HTML STRUCTURE - Direct approach with the selector
    markdown += `## 1. HTML Structure\n\n`;
    
    try {
        // Use the selector input directly instead of stored element
        const selector = window.rea.selectorInput.value;
        console.log("Using selector:", selector);
        
        const element = document.querySelector(selector);
        console.log("Found element:", element);
        
        if (element) {
            console.log("Element tagName:", element.tagName);
            
            // Skip style elements
            if (element.tagName.toLowerCase() === 'style') {
                markdown += "Cannot export HTML for <style> elements. Please select a different element.\n\n";
            } else {
                // Very simple HTML output approach
                let html = '';
                
                // Function to safely get element HTML
                function getElementHTML(el, depth = 0) {
                    if (depth > 10) return ''; // Prevent infinite recursion
                    
                    const indent = '  '.repeat(depth);
                    let result = indent + '<' + el.tagName.toLowerCase();
                    
                    // Add attributes
                    if (el.id) result += ' id="' + el.id + '"';
                    if (el.className) result += ' class="' + el.className + '"';
                    
                    result += '>\n';
                    
                    // Add children (configurable limit)
                    const maxChildren = window.rea.settings?.maxExportChildren || 500;
                    const children = Array.from(el.children).slice(0, maxChildren);
                    
                    for (let child of children) {
                        result += getElementHTML(child, depth + 1);
                    }
                    
                    if (el.children.length > maxChildren) {
                        result += indent + '  <!-- ' + (el.children.length - maxChildren) + ' more children omitted -->\n';
                    }
                    
                    result += indent + '</' + el.tagName.toLowerCase() + '>\n';
                    return result;
                }
                
                html = getElementHTML(element);
                
                // Limit the size if it's too large (configurable)
                const maxExportSize = window.rea.settings?.maxExportSize || 100000;
                if (html.length > maxExportSize) {
                    html = html.substring(0, maxExportSize) + "\n... (output truncated - increase maxExportSize in settings to see more)";
                }
                
                markdown += "```html\n" + html + "\n```\n\n";
            }
        } else {
            markdown += "No element found with selector: `" + selector + "`\n\n";
        }
    } catch (e) {
        console.error("Error generating HTML:", e);
        markdown += "Error generating HTML: " + e.message + "\n\n";
    }
    
    // SECTION 2: CSS RULES
    markdown += `## 2. CSS Rules\n\n`;
    
    // Deduplicate CSS rules
    const uniqueCssRules = new Set();
    window.rea.analyzedElements.forEach((data) => {
      if (data.css && data.css.applied) {
        Object.values(data.css.applied).flat().forEach(rule => {
          // Format the CSS rule with proper indentation
          const formattedCSS = rule.cssText
            .replace(/\{/g, ' {\n  ')
            .replace(/\}/g, '\n}')
            .replace(/;/g, ';\n  ')
            .replace(/\n  \}/g, '\n}');
          
          uniqueCssRules.add(formattedCSS);
        });
      }
    });
    
    // Add all CSS rules in a single code block
    if (uniqueCssRules.size > 0) {
      markdown += "```css\n";
      
      // Sort CSS rules for consistent output
      const sortedRules = Array.from(uniqueCssRules).sort();
      markdown += sortedRules.join('\n\n');
      
      markdown += "\n```\n\n";
    } else {
      markdown += "No CSS rules found for analyzed elements.\n\n";
    }
    
    // SECTION 3: JAVASCRIPT (only if not Structure & CSS Only mode)
    const analysisMode = window.rea.modeSelect ? window.rea.modeSelect.value : 'full';
    const includeJS = analysisMode !== 'structure-css' && window.rea.settings.includeJavaScript;
    
    if (includeJS) {
      markdown += `## 3. JavaScript\n\n`;
      
      // 3.1 Event Listeners
      const allEventListeners = [];
    window.rea.analyzedElements.forEach((data) => {
      if (data.js && data.js.eventListeners && data.js.eventListeners.length > 0) {
        data.js.eventListeners.forEach(listener => {
          allEventListeners.push({
            handler: listener.handler
          });
        });
      }
    });
    
    if (allEventListeners.length > 0) {
      markdown += `### Event Listeners\n\n`;
      
      // Deduplicate event handlers
      const uniqueHandlers = new Set();
      allEventListeners.forEach(listener => {
        uniqueHandlers.add(listener.handler);
      });
      
      // Output event handlers
      markdown += "```javascript\n";
      
      Array.from(uniqueHandlers).forEach(handler => {
        markdown += handler + '\n\n';
      });
      
      markdown += "```\n\n";
    }
    
    // 3.2 JavaScript References
    const allJsReferences = [];
    window.rea.analyzedElements.forEach((data) => {
      if (data.js && data.js.references && data.js.references.length > 0) {
        data.js.references.forEach(ref => {
          allJsReferences.push({
            code: ref.code
          });
        });
      }
    });
    
    if (allJsReferences.length > 0) {
      markdown += `### JavaScript References\n\n`;
      
      // Deduplicate code snippets
      const uniqueSnippets = new Set();
      allJsReferences.forEach(ref => {
        uniqueSnippets.add(ref.code);
      });
      
      // Output code snippets
      markdown += "```javascript\n";
      
      Array.from(uniqueSnippets).forEach(snippet => {
        markdown += snippet + '\n\n';
      });
      
      markdown += "```\n\n";
    }
    } // End of JavaScript section conditional
    
    // SECTION 4: COMPUTED STYLES
    markdown += `## 4. Computed Styles\n\n`;
    
    // Get the selected element data
    const selectedElementData = window.rea.selectedElement ? 
                               window.rea.analyzedElements.get(window.rea.selectedElement) : null;
    
    if (selectedElementData && selectedElementData.css && selectedElementData.css.computed) {
      markdown += `### Computed Styles for ${selectedElementData.selector}\n\n`;
      
      // Group properties by category
      const categories = {
        'Layout': ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'],
        'Box Model': ['margin', 'padding', 'border', 'box-sizing'],
        'Typography': ['font', 'color', 'text', 'line-height', 'letter-spacing'],
        'Background': ['background'],
        'Other': []
      };
      
      const propertyCategories = {};
      
      // Categorize each property
      Object.entries(selectedElementData.css.computed).forEach(([prop, value]) => {
        let category = 'Other';
        
        // Check which category this property belongs to
        for (const [cat, props] of Object.entries(categories)) {
          if (props.some(p => prop.startsWith(p))) {
            category = cat;
            break;
          }
        }
        
        if (!propertyCategories[category]) {
          propertyCategories[category] = [];
        }
        
        propertyCategories[category].push({prop, value});
      });
      
      // Add each category
      Object.entries(propertyCategories).forEach(([category, properties]) => {
        if (properties.length === 0) return;
        
        markdown += `#### ${category}\n\n`;
        markdown += "```css\n";
        
        // Sort properties alphabetically
        properties.sort((a, b) => a.prop.localeCompare(b.prop));
        
        // Add each property
        properties.forEach(({prop, value}) => {
          markdown += `${prop}: ${value};\n`;
        });
        
        markdown += "```\n\n";
      });
    } else {
      markdown += "No computed styles available.\n\n";
    }
    
    // Create timestamp for filename
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Create download link
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `element-extract_${timestamp}.md`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Show success message
    console.log("Export complete");
    alert(`Element code extracted and exported!`);
};
})();

// Recursive Element Analyzer - Part 4: Initialization
(function() {
  // Initialize the tool
  const init = function() {
    // Create the UI
    const ui = window.rea.createUI();
    window.rea.selectorInput = ui.selectorInput;
    window.rea.depthSelect = ui.depthSelect;
    window.rea.modeSelect = ui.modeSelect;
    window.rea.contentElements = ui.contentElements;
    
    // Add UI to the DOM
    document.body.appendChild(ui.container);
    
    // Set up button click handlers
    ui.pickBtn.addEventListener('click', window.rea.startInspecting);
    
    ui.analyzeBtn.addEventListener('click', () => {
      const selector = window.rea.selectorInput.value.trim();
      if (selector) {
        const element = document.querySelector(selector);
        if (element) {
          window.rea.analyzeElementTree(element, selector);
        } else {
          alert(`Could not find element matching "${selector}"`);
        }
      } else {
        alert('Please enter a CSS selector or use the picker');
      }
    });
  }
  
  // Start the tool
  init();
  
  console.log("Recursive Element Analyzer loaded successfully!");
})();
