document.addEventListener('DOMContentLoaded', async function () {
    // ==================== DOM 元素引用 ====================
    const dom = {
        foodItems: document.getElementById('food-items'),
        addCategoryBtn: document.getElementById('add-category-button'),
        newCategory: document.getElementById('new-category'),
        addFoodBtn: document.getElementById('add-food-button'),
        newFood: document.getElementById('new-food'),
        spinBtn: document.getElementById('spin-button'),
        canvas: document.getElementById('roulette-wheel'),
        ctx: document.getElementById('roulette-wheel').getContext('2d'),
        pointer: document.getElementById('pointer')
    };

    // ==================== 状态验证 ====================
    const requiredElements = ['foodItems', 'addCategoryBtn', 'addFoodBtn', 'spinBtn', 'canvas', 'pointer'];
    requiredElements.forEach(key => {
        if (!dom[key]) throw new Error(`关键元素 ${key} 未找到`);
    });

    // ==================== 应用状态 ====================
    let state = {
        foodCategories: [],
        selectedCategory: null,
        segments: [],
        isSpinning: false
    };

    // ==================== 数据初始化 ====================
    async function initializeData() {
        try {
            // 1. 尝试从本地存储加载
            const savedState = localStorage.getItem('foodRouletteState');
            
            if (savedState) {
                const parsed = JSON.parse(savedState);
                state.foodCategories = parsed.foodCategories.map(category => ({
                    ...category,
                    foods: category.foods.map(food => ({
                        ...food,
                        checked: true
                    }))
                }));
                return;
            }

            // 2. 从JSON文件加载默认数据
            const response = await fetch('<%- url_for("/data/foods.json") %>');
            if (!response.ok) throw new Error('网络响应不正常');
            
            const defaultData = await response.json();
            state.foodCategories = defaultData.foodCategories.map(category => ({
                ...category,
                foods: category.foods.map(food => ({
                    ...food,
                    checked: true
                }))
            }));

        } catch (error) {
            console.error('数据加载失败:', error);
            // 3. 回退硬编码数据
            state.foodCategories = [{
                name: "默认分类",
                foods: [{ 
                    name: "示例菜品", 
                    weight: 1, 
                    color: "#ff6b6b", 
                    checked: true 
                }]
            }];
        }
    }

    // ==================== 事件监听 ====================
    function bindEvents() {
        dom.foodItems.addEventListener('change', handleCategoryChange);
        dom.foodItems.addEventListener('click', handleDeleteFood);
        dom.foodItems.addEventListener('change', handleWeightChange);
        dom.foodItems.addEventListener('change', handleColorChange);
        dom.foodItems.addEventListener('change', handleCheckboxChange);
        
        dom.addCategoryBtn.addEventListener('click', addCategory);
        dom.addFoodBtn.addEventListener('click', addFood);
        dom.spinBtn.addEventListener('click', startSpin);
    }

    // ==================== 核心功能 ====================
    function handleCategoryChange(e) {
        if (e.target.matches('input[type="radio"][name="category"]')) {
            state.selectedCategory = e.target.value;
        }
    }

    function handleDeleteFood(e) {
        if (!e.target.matches('.delete-button')) return;
        
        const li = e.target.closest('li');
        const foodName = li.querySelector('.food-checkbox').value;
        const category = state.foodCategories.find(c => c.name === state.selectedCategory);
        
        if (category) {
            category.foods = category.foods.filter(f => f.name !== foodName);
            renderFoodList();
            updateRoulette();
        }
    }

    function handleWeightChange(e) {
        if (!e.target.matches('.weight-input')) return;
        
        const input = e.target;
        const foodName = input.closest('li').querySelector('.food-checkbox').value;
        const category = state.foodCategories.find(c => c.name === state.selectedCategory);
        const food = category?.foods.find(f => f.name === foodName);

        if (food) {
            // 修复的代码行（原第118行）
            food.weight = Math.max(1, parseInt(input.value) || 1);
            updateRoulette();
        }
    }

    function handleColorChange(e) {
        if (!e.target.matches('.color-input')) return;
        
        const input = e.target;
        const foodName = input.closest('li').querySelector('.food-checkbox').value;
        const category = state.foodCategories.find(c => c.name === state.selectedCategory);
        const food = category?.foods.find(f => f.name === foodName);

        if (food) {
            food.color = input.value;
            updateRoulette();
        }
    }

    function handleCheckboxChange(e) {
        if (!e.target.matches('.food-checkbox')) return;
        
        const foodName = e.target.value;
        state.foodCategories.forEach(category => {
            const food = category.foods.find(f => f.name === foodName);
            if (food) {
                food.checked = e.target.checked;
                updateRoulette();
                updateFoodItemStyle(e.target.closest('li'), food.checked);
            }
        });
    }

    function addCategory() {
        const categoryName = dom.newCategory.value.trim();
        if (!categoryName || state.foodCategories.some(c => c.name === categoryName)) return;

        state.foodCategories.push({
            name: categoryName,
            foods: []
        });
        dom.newCategory.value = '';
        renderFoodList();
    }

    function addFood() {
        const foodName = dom.newFood.value.trim();
        if (!foodName || !state.selectedCategory) return;

        const category = state.foodCategories.find(c => c.name === state.selectedCategory);
        if (category && !category.foods.some(f => f.name === foodName)) {
            category.foods.push({
                name: foodName,
                weight: 1,
                color: getRandomColor(),
                checked: true
            });
            dom.newFood.value = '';
            renderFoodList();
            updateRoulette();
        }
    }

    // ==================== 视图渲染 ====================
    function renderFoodList() {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        
        dom.foodItems.innerHTML = state.foodCategories.map(category => `
            <div class="category">
                <label class="category-label">
                    <input 
                        type="radio" 
                        name="category" 
                        value="${category.name}"
                        ${category.name === state.selectedCategory ? 'checked' : ''}
                    >
                    <span class="category-name">${category.name}</span>
                </label>
                <ul class="food-list">
                    ${category.foods.map(food => `
                        <li class="food-item" data-checked="${food.checked}">
                            <label class="food-label">
                                <input 
                                    type="checkbox" 
                                    class="food-checkbox"
                                    value="${food.name}" 
                                    ${food.checked ? 'checked' : ''}
                                >
                                <span class="food-name">${food.name}</span>
                                <input 
                                    type="${isMobile ? 'number' : 'text'}" 
                                    class="weight-input"
                                    value="${food.weight}" 
                                    min="1" 
                                >
                                <input 
                                    type="${isMobile ? 'text' : 'color'}" 
                                    class="color-input"
                                    value="${food.color}" 
                                >
                            </label>
                            <button class="delete-button">×</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    }

    // ==================== 转盘功能 ====================
    function updateRoulette() {
        try {
            const allFoods = state.foodCategories
                .flatMap(c => c.foods)
                .filter(f => f.checked && f.weight > 0);

            if (allFoods.length === 0) {
                showEmptyState();
                return;
            }

            const totalWeight = allFoods.reduce((sum, f) => sum + f.weight, 0);
            let currentAngle = 0;
            
            state.segments = allFoods.map(food => {
                const angle = (food.weight / totalWeight) * 360;
                const segment = {
                    ...food,
                    startAngle: currentAngle,
                    endAngle: currentAngle + angle
                };
                currentAngle += angle;
                return segment;
            });

            if (state.segments.length > 0) {
                state.segments[state.segments.length - 1].endAngle = 360;
            }

            drawRoulette();
        } catch (error) {
            console.error('转盘更新失败:', error);
            showErrorState();
        }
    }

    function drawRoulette() {
        const { ctx, canvas } = dom;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.remove('roulette-empty');

        state.segments.forEach(segment => {
            const startAngle = segment.startAngle * Math.PI / 180;
            const endAngle = segment.endAngle * Math.PI / 180;

            const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
            gradient.addColorStop(0, segment.color);
            gradient.addColorStop(1, darkenColor(segment.color, 0.3));

            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 200, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate((startAngle + endAngle) / 2);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(segment.name, 140, 5);
            ctx.restore();
        });
    }

    // ==================== 旋转逻辑 ====================
    function startSpin() {
        if (state.isSpinning || state.segments.length === 0) return;
        
        state.isSpinning = true;
        dom.spinBtn.disabled = true;

        const computedStyle = window.getComputedStyle(dom.canvas);
        const matrix = computedStyle.transform;
        // 修复的代码行（原第306行）
        const currentRotation = matrix !== 'none' 
            ? Math.round((Math.atan2(...matrix.split('(')[1].split(')')[0].split(',').slice(4,6)) * (180 / Math.PI) % 360))
            : 0;

        const fullRotations = 5;
        const spinDuration = 4000;
        const targetDegrees = currentRotation + (360 * fullRotations) + getTargetOffset();

        dom.canvas.style.transition = `transform ${spinDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        dom.canvas.style.transform = `rotate(${targetDegrees}deg)`;
        
        const onAnimationEnd = () => {
            dom.canvas.removeEventListener('transitionend', onAnimationEnd);
            showResult(getFinalSegment(targetDegrees));
            state.isSpinning = false;
            dom.spinBtn.disabled = false;
            dom.canvas.style.transition = '';
        };

        dom.canvas.addEventListener('transitionend', onAnimationEnd);
    }

    // ==================== 数据持久化 ====================
    function saveState() {
        const saveData = {
            foodCategories: state.foodCategories.map(category => ({
                ...category,
                foods: category.foods.map(food => ({
                    name: food.name,
                    weight: food.weight,
                    color: food.color
                }))
            }))
        };
        localStorage.setItem('foodRouletteState', JSON.stringify(saveData));
    }

    // ==================== 工具函数 ====================
    function getRandomColor() {
        return `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    function darkenColor(hex, amount) {
        const r = Math.max(0, parseInt(hex.substr(1,2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(3,2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(5,2), 16) * (1 - amount));
        return `#${[r,g,b].map(v => Math.floor(v).toString(16).padStart(2,'0')).join('')}`;
    }

    function updateFoodItemStyle(liElement, isChecked) {
        liElement.dataset.checked = isChecked;
        const secondaryElements = liElement.querySelectorAll('.weight-input, .color-input');
        secondaryElements.forEach(el => {
            el.style.opacity = isChecked ? '1' : '0.5';
            el.style.pointerEvents = isChecked ? 'auto' : 'none';
        });
    }

    function showEmptyState() {
        dom.canvas.classList.add('roulette-empty');
        const ctx = dom.ctx;
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('请至少选择一个菜品', 200, 200);
    }

    function showErrorState() {
        const ctx = dom.ctx;
        ctx.fillStyle = '#e74c3c';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('转盘初始化失败', 200, 200);
    }

    function getTargetOffset() {
        const validSegments = state.segments.filter(s => s.weight > 0);
        const targetSegment = validSegments[Math.floor(Math.random() * validSegments.length)];
        const segmentCenter = (targetSegment.startAngle + targetSegment.endAngle) / 2;
        return 360 - segmentCenter;
    }

    function getFinalSegment(totalDegrees) {
        const normalizedDegrees = (360 - (totalDegrees % 360)) % 360;
        return state.segments.find(s => 
            normalizedDegrees >= s.startAngle && 
            normalizedDegrees < s.endAngle
        );
    }

    function showResult(segment) {
        const modal = document.createElement('div');
        modal.className = 'result-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🎉 抽中结果</h3>
                <div class="result-color" style="background: ${segment.color}"></div>
                <p>${segment.name}</p>
                <button class="modal-close">关闭</button>
            </div>
        `;
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.body.appendChild(modal);
    }

    // ==================== 数据管理功能 ====================
    window.exportData = function() {
        const dataStr = JSON.stringify(state.foodCategories, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `food-roulette-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    window.importData = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                state.foodCategories = imported.map(category => ({
                    ...category,
                    foods: category.foods.map(food => ({
                        ...food,
                        checked: true
                    }))
                }));
                renderFoodList();
                updateRoulette();
                saveState();
                e.target.value = '';
            } catch (error) {
                alert('文件格式错误！');
            }
        };
        reader.readAsText(file);
    }

    window.clearData = function() {
        if (confirm('确定要重置所有数据吗？')) {
            localStorage.removeItem('foodRouletteState');
            location.reload();
        }
    }

    // ==================== 初始化流程 ====================
    await initializeData();
    state.selectedCategory = state.foodCategories[0]?.name;
    bindEvents();
    renderFoodList();
    updateRoulette();

    // 自动保存逻辑
    const saveDebounce = debounce(saveState, 500);
    document.addEventListener('input', saveDebounce);
    document.addEventListener('click', saveDebounce);

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
});