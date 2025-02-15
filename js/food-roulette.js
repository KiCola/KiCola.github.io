document.addEventListener('DOMContentLoaded', function () {
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
        if (!dom[key]) {
            console.error(`关键元素 ${key} 未找到`, dom[key]);
            throw new Error(`页面初始化失败：${key} 元素缺失`);
        }
    });

    // ==================== 应用状态 ====================
    let state = {
        foodCategories: [
            {
                name: "肉类",
                foods: [
                    { name: "白切鸡", weight: 1, color: "#ff6f61", checked: true },
                    { name: "黄焖鸡", weight: 2, color: "#ffcc00", checked: true }
                ]
            },
            {
                name: "蔬菜",
                foods: [
                    { name: "炒青菜", weight: 1, color: "#00cc66", checked: true },
                    { name: "凉拌黄瓜", weight: 2, color: "#66ccff", checked: true }
                ]
            }
        ],
        selectedCategory: null,
        segments: [],
        isSpinning: false
    };

    // ==================== 事件监听 ====================
    dom.foodItems.addEventListener('change', handleCategoryChange);
    dom.foodItems.addEventListener('click', handleDeleteFood);
    dom.foodItems.addEventListener('change', handleWeightChange);
    dom.foodItems.addEventListener('change', handleColorChange);
    dom.foodItems.addEventListener('change', handleCheckboxChange);
    
    dom.addCategoryBtn.addEventListener('click', addCategory);
    dom.addFoodBtn.addEventListener('click', addFood);
    dom.spinBtn.addEventListener('click', startSpin);

    // ==================== 初始化 ====================
    state.selectedCategory = state.foodCategories[0]?.name;
    renderFoodList();
    updateRoulette();

    // ==================== 事件处理器 ====================
    function handleCategoryChange(e) {
        if (e.target.matches('input[type="radio"][name="category"]')) {
            state.selectedCategory = e.target.value;
        }
    }

    function handleDeleteFood(e) {
        if (e.target.matches('.delete-button')) {
            const li = e.target.closest('li');
            const foodName = li.querySelector('.food-checkbox').value;
            const category = state.foodCategories.find(c => c.name === state.selectedCategory);
            
            if (category) {
                category.foods = category.foods.filter(f => f.name !== foodName);
                renderFoodList();
                updateRoulette();
            }
        }
    }

    function handleWeightChange(e) {
        if (e.target.matches('.weight-input')) {
            const input = e.target;
            const foodName = input.closest('li').querySelector('.food-checkbox').value;
            const category = state.foodCategories.find(c => c.name === state.selectedCategory);
            const food = category?.foods.find(f => f.name === foodName);

            if (food) {
                food.weight = Math.max(1, parseInt(input.value) || 1);
                updateRoulette();
            }
        }
    }

    function handleColorChange(e) {
        if (e.target.matches('.color-input')) {
            const input = e.target;
            const foodName = input.closest('li').querySelector('.food-checkbox').value;
            const category = state.foodCategories.find(c => c.name === state.selectedCategory);
            const food = category?.foods.find(f => f.name === foodName);

            if (food) {
                food.color = input.value;
                updateRoulette();
            }
        }
    }

    function handleCheckboxChange(e) {
        if (e.target.matches('.food-checkbox')) {
            const foodName = e.target.value;
            const category = state.foodCategories.find(c => c.name === state.selectedCategory);
            const food = category?.foods.find(f => f.name === foodName);
            
            if (food) {
                food.checked = e.target.checked;
                updateRoulette();
            }
        }
    }

    // ==================== 核心功能 ====================
    function addCategory() {
        const categoryName = dom.newCategory.value.trim();
        if (!categoryName) return;

        if (!state.foodCategories.some(c => c.name === categoryName)) {
            state.foodCategories.push({
                name: categoryName,
                foods: []
            });
            dom.newCategory.value = '';
            renderFoodList();
        }
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

    function renderFoodList() {
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
                        <li class="food-item">
                            <label class="food-label">
                                <input 
                                    type="checkbox" 
                                    class="food-checkbox"
                                    value="${food.name}" 
                                    ${food.checked ? 'checked' : ''}
                                >
                                <span class="food-name">${food.name}</span>
                                <input 
                                    type="number" 
                                    class="weight-input"
                                    value="${food.weight}" 
                                    min="1" 
                                >
                                <input 
                                    type="color" 
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

    function updateRoulette() {
        const allFoods = state.foodCategories
            .flatMap(c => c.foods)
            .filter(f => f.checked);
        
        const totalWeight = allFoods.reduce((sum, f) => sum + f.weight, 0);
        
        state.segments = allFoods.reduce((acc, food) => {
            const angle = (food.weight / totalWeight) * 360;
            const startAngle = acc.length > 0 ? acc[acc.length-1].endAngle : 0;
            return [...acc, {
                ...food,
                startAngle,
                endAngle: startAngle + angle
            }];
        }, []);

        drawRoulette();
    }

    function drawRoulette() {
        const { ctx, canvas } = dom;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        state.segments.forEach(segment => {
            const startAngle = segment.startAngle * Math.PI / 180;
            const endAngle = segment.endAngle * Math.PI / 180;

            // 创建渐变
            const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
            gradient.addColorStop(0, segment.color);
            gradient.addColorStop(1, darkenColor(segment.color, 0.3));

            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 200, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.stroke();

            // 绘制文字
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

    function startSpin() {
        if (state.isSpinning || state.segments.length === 0) return;
        
        state.isSpinning = true;
        const spinDuration = 3000;
        const targetRotation = Math.random() * 360 * 5 + 720; // 至少旋转2圈
        
        dom.canvas.style.transition = `transform ${spinDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        dom.canvas.style.transform = `rotate(${targetRotation}deg)`;

        setTimeout(() => {
            const finalRotation = targetRotation % 360;
            const winningSegment = state.segments.find(s => 
                finalRotation >= s.startAngle && 
                finalRotation < s.endAngle
            );
            
            dom.canvas.style.transition = '';
            state.isSpinning = false;
            alert(`恭喜你选中了：${winningSegment.name}`);
        }, spinDuration);
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
});