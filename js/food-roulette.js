document.addEventListener('DOMContentLoaded', function () {
    const foodItemsContainer = document.getElementById('food-items');
    const addCategoryButton = document.getElementById('add-category-button');
    const newCategoryInput = document.getElementById('new-category');
    const addFoodButton = document.getElementById('add-food-button');
    const newFoodInput = document.getElementById('new-food');
    const spinButton = document.getElementById('spin-button');
    const canvas = document.getElementById('roulette-wheel');
    const ctx = canvas.getContext('2d');

    // 初始食物种类和菜品
    let foodCategories = [
        {
            name: "肉类",
            foods: [
                { name: "白切鸡", weight: 1, color: "#ff6f61" },
                { name: "黄焖鸡", weight: 2, color: "#ffcc00" }
            ]
        },
        {
            name: "蔬菜",
            foods: [
                { name: "炒青菜", weight: 1, color: "#00cc66" },
                { name: "凉拌黄瓜", weight: 2, color: "#66ccff" }
            ]
        }
    ];

    let segments = [];

    // 添加食物种类
    addCategoryButton.addEventListener('click', function () {
        const categoryName = newCategoryInput.value.trim();
        if (categoryName && !foodCategories.some(category => category.name === categoryName)) {
            foodCategories.push({ name: categoryName, foods: [] });
            newCategoryInput.value = ''; // 清空输入框
            renderFoodList();
        }
    });

    // 添加菜品
    addFoodButton.addEventListener('click', function () {
        const foodName = newFoodInput.value.trim();
        const selectedCategory = document.querySelector('input[name="category"]:checked');
        if (foodName && selectedCategory) {
            const category = foodCategories.find(cat => cat.name === selectedCategory.value);
            if (category && !category.foods.some(food => food.name === foodName)) {
                category.foods.push({ name: foodName, weight: 1, color: getRandomColor() });
                newFoodInput.value = ''; // 清空输入框
                renderFoodList();
                updateRoulette();
            }
        }
    });

    // 渲染食物种类和菜品列表
    function renderFoodList() {
        foodItemsContainer.innerHTML = ''; // 清空现有列表
        foodCategories.forEach((category, catIndex) => {
            // 渲染食物种类
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';

            const categoryLabel = document.createElement('label');
            const categoryCheckbox = document.createElement('input');
            categoryCheckbox.type = 'radio';
            categoryCheckbox.name = 'category';
            categoryCheckbox.value = category.name;
            categoryCheckbox.checked = catIndex === 0; // 默认选中第一个种类

            categoryLabel.appendChild(categoryCheckbox);
            categoryLabel.appendChild(document.createTextNode(` ${category.name}`));
            categoryDiv.appendChild(categoryLabel);

            // 渲染菜品
            const foodList = document.createElement('ul');
            category.foods.forEach((food, foodIndex) => {
                const foodItem = document.createElement('li');
                const foodLabel = document.createElement('label');
                const foodCheckbox = document.createElement('input');
                foodCheckbox.type = 'checkbox';
                foodCheckbox.value = food.name;
                foodCheckbox.checked = true; // 默认选中

                // 删除菜品按钮
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '×';
                deleteButton.className = 'delete-button';
                deleteButton.addEventListener('click', function () {
                    category.foods = category.foods.filter(item => item.name !== food.name);
                    renderFoodList();
                    updateRoulette();
                });

                // 调整菜品比例
                const weightInput = document.createElement('input');
                weightInput.type = 'number';
                weightInput.value = food.weight;
                weightInput.min = 1;
                weightInput.addEventListener('change', function () {
                    food.weight = parseInt(this.value);
                    updateRoulette();
                });

                foodLabel.appendChild(foodCheckbox);
                foodLabel.appendChild(document.createTextNode(` ${food.name} `));
                foodLabel.appendChild(weightInput);
                foodItem.appendChild(foodLabel);
                foodItem.appendChild(deleteButton);
                foodList.appendChild(foodItem);
            });

            categoryDiv.appendChild(foodList);
            foodItemsContainer.appendChild(categoryDiv);
        });
    }

    // 更新转盘
    function updateRoulette() {
        const allFoods = foodCategories.flatMap(category => category.foods);
        const totalWeight = allFoods.reduce((sum, food) => sum + food.weight, 0);
        let startAngle = 0;

        segments = allFoods.map((food, index) => {
            const angle = (food.weight / totalWeight) * 360;
            const segment = {
                label: food.name,
                angle: angle,
                color: food.color,
                startAngle: startAngle,
                endAngle: startAngle + angle
            };
            startAngle += angle;
            return segment;
        });

        drawRoulette();
    }

    // 绘制转盘
    function drawRoulette() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        segments.forEach(segment => {
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 200, segment.startAngle * Math.PI / 180, segment.endAngle * Math.PI / 180);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.stroke();

            // 添加文字标注
            ctx.save();
            ctx.translate(200, 200);
            ctx.rotate((segment.startAngle + segment.endAngle) / 2 * Math.PI / 180);
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(segment.label, 120, 10);
            ctx.restore();
        });
    }

    // 旋转转盘
    spinButton.addEventListener('click', function () {
        if (segments.length === 0) return;
        let spinDuration = 3000; // 3 seconds
        let spinEnd = Math.random() * 360;
        spinWheel(spinEnd, spinDuration);
    });

    function spinWheel(spinEnd, spinDuration) {
        // 添加旋转动画
        canvas.classList.add('animate__animated', 'animate__rotateIn');
        setTimeout(() => {
            canvas.classList.remove('animate__animated', 'animate__rotateIn');
        }, spinDuration);

        let startTime = null;
        function animate(time) {
            if (!startTime) startTime = time;
            let progress = time - startTime;
            let rotation = (progress / spinDuration) * 360;
            canvas.style.transform = `rotate(${rotation}deg)`;
            if (progress < spinDuration) {
                requestAnimationFrame(animate);
            } else {
                canvas.style.transform = `rotate(${spinEnd}deg)`;
                let finalAngle = spinEnd % 360;
                let winningSegment = segments.find(segment => {
                    return finalAngle >= segment.startAngle && finalAngle < segment.endAngle;
                });

                // 调整指针位置
                const pointer = document.getElementById('pointer');
                const pointerAngle = (winningSegment.startAngle + winningSegment.endAngle) / 2;
                pointer.style.transform = `translate(-50%, -100%) rotate(${pointerAngle}deg)`;

                alert(`恭喜你选中了: ${winningSegment.label}`);
            }
        }
        requestAnimationFrame(animate);
    }

    // 随机生成颜色
    function getRandomColor() {
        return `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    // 初始化
    renderFoodList();
    updateRoulette();
});