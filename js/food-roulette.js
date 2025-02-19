document.addEventListener('DOMContentLoaded', function () {
    // ==================== DOM 元素引用 ====================
    const dom = {
        foodItems: document.getElementById('food-items'),
        addMainCategoryBtn: document.getElementById('add-main-category-button'),
        newMainCategory: document.getElementById('new-main-category'),
        addSubCategoryBtn: document.getElementById('add-sub-category-button'),
        newSubCategory: document.getElementById('new-sub-category'),
        addFoodBtn: document.getElementById('add-food-button'),
        newFood: document.getElementById('new-food'),
        spinBtn: document.getElementById('spin-button'),
        canvas: document.getElementById('roulette-wheel'),
        ctx: document.getElementById('roulette-wheel').getContext('2d'),
        pointer: document.getElementById('pointer')
    };


    // ==================== 状态验证 ====================
    const requiredElements = [
        'foodItems', 'addMainCategoryBtn', 'addSubCategoryBtn',
        'addFoodBtn', 'spinBtn', 'canvas', 'pointer'
    ];
    requiredElements.forEach(key => {
        if (!dom[key]) {
            console.error(`关键元素 ${key} 未找到`);
            throw new Error(`页面初始化失败：${key} 元素缺失`);
        }
    });

    // ==================== 应用状态 ====================
    let state = {
        foodCategories: [
            {
                name: "校外",
                subCategories: [
                    {
                        name: "韵酒",
                        foods: [
                            { name: "黄焖鸡", weight: 2, color: "#ffcc00", checked: true }
                        ]
                    }
                ]
            }
        ],
        selectedMainCategory: "校外",
        selectedSubCategory: "韵酒"
    };

    // ==================== 事件监听 ====================
    dom.foodItems.addEventListener('change', function(e) {
        if (e.target.matches('.main-category-radio')) {
            handleMainCategoryChange(e);
        }
        else if (e.target.matches('.sub-category-radio')) {
            handleSubCategoryChange(e);
        }
        else if (e.target.matches('.food-checkbox')) {
            handleCheckboxChange(e);
        }
        else if (e.target.matches('.weight-input')) {
            handleWeightChange(e);
        }
        else if (e.target.matches('.color-input')) {
            handleColorChange(e);
        }
    });

    dom.foodItems.addEventListener('click', handleDeleteFood);

    
    dom.addMainCategoryBtn.addEventListener('click', addMainCategory);
    dom.addSubCategoryBtn.addEventListener('click', addSubCategory);
    dom.addFoodBtn.addEventListener('click', addFood);
    dom.spinBtn.addEventListener('click', startSpin);

    // ==================== 初始化 ====================
    renderFoodList();
    updateRoulette();

    // ==================== 事件处理器 ====================
    function handleMainCategoryChange(e) {
        state.selectedMainCategory = e.target.value;
        state.selectedSubCategory = null;
        renderFoodList();
        updateRoulette();
    }

    // 新增：处理子分类选择
    function handleSubCategoryChange(e) {
        state.selectedSubCategory = e.target.value;
        renderFoodList();
    }


    function handleDeleteFood(e) {
        if (e.target.matches('.delete-button')) {
            const li = e.target.closest('li');
            const foodName = li.querySelector('.food-checkbox').value;
            
            const mainCat = state.foodCategories.find(c => c.name === state.selectedMainCategory);
            const subCat = mainCat?.subCategories.find(s => s.name === state.selectedSubCategory);
            
            if (subCat) {
                subCat.foods = subCat.foods.filter(f => f.name !== foodName);
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
                renderFoodList();
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
                renderFoodList();
                updateRoulette();
            }
        }
    }

    // 修改：完善复选框状态处理
    function handleCheckboxChange(e) {
        const foodName = e.target.value;
        const checked = e.target.checked;
        
        // 遍历所有分类找到对应菜品
        state.foodCategories.forEach(mainCat => {
            mainCat.subCategories.forEach(subCat => {
                const food = subCat.foods.find(f => f.name === foodName);
                if (food) {
                    food.checked = checked;
                }
            });
        });

        updateRoulette();
        updateFoodItemStyle(e.target.closest('li'), checked);
    }

    // ==================== 核心功能 ====================
    function addMainCategory() {
        const categoryName = dom.newMainCategory.value.trim();
        if (!categoryName) return;

        if (!state.foodCategories.some(c => c.name === categoryName)) {
            state.foodCategories.push({
                name: categoryName,
                subCategories: []
            });
            dom.newMainCategory.value = '';
            renderFoodList();
        }
    }

    function addSubCategory() {
        const categoryName = dom.newSubCategory.value.trim();
        const mainCategory = state.foodCategories.find(c => c.name === state.selectedMainCategory);
        
        if (mainCategory && categoryName) {
            if (!mainCategory.subCategories.some(s => s.name === categoryName)) {
                mainCategory.subCategories.push({
                    name: categoryName,
                    foods: []
                });
                dom.newSubCategory.value = '';
                renderFoodList();
            }
        }
    }

    function addFood() {
        const foodName = dom.newFood.value.trim();
        const mainCategory = state.foodCategories.find(c => c.name === state.selectedMainCategory);
        const subCategory = mainCategory?.subCategories.find(s => s.name === state.selectedSubCategory);
        
        if (subCategory && foodName) {
            if (!subCategory.foods.some(f => f.name === foodName)) {
                subCategory.foods.push({
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
    }

    function renderFoodList() {
        dom.foodItems.innerHTML = state.foodCategories.map(mainCat => `
            <div class="main-category">
                <label class="category-label main-category-label">
                    <input type="radio" 
                        class="main-category-radio"
                        name="main-category" 
                        value="${mainCat.name}"
                        ${mainCat.name === state.selectedMainCategory ? 'checked' : ''}>
                    <span class="category-name">${mainCat.name}</span>
                </label>
                
                ${mainCat.subCategories.map(subCat => `
                    <div class="sub-category">
                        <label class="category-label sub-category-label">
                            <input type="radio"
                                class="sub-category-radio"
                                name="sub-category"
                                value="${subCat.name}"
                                ${subCat.name === state.selectedSubCategory ? 'checked' : ''}>
                            <span class="category-name">${subCat.name}</span>
                        </label>
                        
                        <ul class="food-list">
                            ${subCat.foods.map(food => `
                                <li class="food-item" data-checked="${food.checked}">
                                    <label class="food-label">
                                        <input 
                                            type="checkbox" 
                                            class="food-checkbox"
                                            value="${food.name}" 
                                            ${food.checked ? 'checked' : ''}>
                                        <span class="food-name">${food.name}</span>
                                        <input 
                                            type="number" 
                                            class="weight-input"
                                            value="${food.weight}" 
                                            min="1">
                                        <input 
                                            type="color" 
                                            class="color-input"
                                            value="${food.color}">
                                    </label>
                                    <button class="delete-button">×</button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    function updateRoulette() {
        try {
            // 获取所有选中菜品（三级结构遍历）
            const allFoods = state.foodCategories
                .flatMap(mainCat => mainCat.subCategories)
                .flatMap(subCat => subCat.foods)
                .filter(f => f.checked && f.weight > 0); // 关键修改：只保留checked为true的菜品

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

            // 修正最后一个扇区角度
            if (state.segments.length > 0) {
                state.segments[state.segments.length - 1].endAngle = 360;
            }

            drawRoulette();
        } catch (error) {
            console.error('转盘更新失败:', error);
            showErrorState();
        }
    }

    function getRandomColor() {
        return `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    function drawRoulette() {
        const { ctx, canvas } = dom;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 清除空状态
        canvas.classList.remove('roulette-empty');

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
        const baseRotation = 360 * 5;
        const targetRotation = baseRotation + Math.random() * 360;
        
        dom.canvas.style.transform = 'rotate(0deg)';
        const startTime = Date.now();
        
        function animate() {
            const progress = Date.now() - startTime;
            const percentage = Math.min(progress / spinDuration, 1);
            const currentRotation = targetRotation * percentage;
            
            dom.canvas.style.transform = `rotate(${currentRotation}deg)`;
            
            if (percentage < 1) {
                requestAnimationFrame(animate);
            } else {
                const finalRotation = (targetRotation % 360 + 360) % 360;
                const winningSegment = state.segments.find(s => 
                    finalRotation >= s.startAngle && 
                    finalRotation < s.endAngle
                );
                
                if (winningSegment) {
                    const centerAngle = (winningSegment.startAngle + winningSegment.endAngle) / 2;
                    dom.pointer.style.transform = `translate(-50%, -100%) rotate(${centerAngle}deg)`;
                    
                    dom.canvas.classList.add('result-highlight');
                    setTimeout(() => {
                        dom.canvas.classList.remove('result-highlight');
                    }, 1000);
                    
                    alert(`恭喜你选中了：${winningSegment.name}`);
                }
                
                state.isSpinning = false;
            }
        }
        
        requestAnimationFrame(animate);
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
        const controls = liElement.querySelectorAll('.weight-input, .color-input');
        controls.forEach(control => {
            control.disabled = !isChecked;
            control.style.opacity = isChecked ? 1 : 0.5;
        });
        liElement.style.opacity = isChecked ? 1 : 0.6;
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
});