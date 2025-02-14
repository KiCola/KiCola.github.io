document.addEventListener('DOMContentLoaded', function() {
    const foodItemsContainer = document.getElementById('food-items');
    const addFoodButton = document.getElementById('add-food-button');
    const newFoodInput = document.getElementById('new-food');
    const categorySelect = document.getElementById('category-select');
    const spinButton = document.getElementById('spin-button');
    const canvas = document.getElementById('roulette-wheel');
    const ctx = canvas.getContext('2d');

    let selectedFoods = []; // 当前选中的食物列表
    let segments = []; // 转盘扇区
    let foodData = {}; // 从 _data/foods.json 加载的食物数据

    // 从 _data/foods.json 加载食物数据
    function loadFoods() {
        fetch('/_data/foods.json')
            .then(response => response.json())
            .then(data => {
                foodData = data;
                renderCategorySelect(); // 渲染分类选择
                renderFoodList(); // 渲染食物列表
            })
            .catch(error => console.error('加载食物数据失败:', error));
    }

    // 渲染分类选择
    function renderCategorySelect() {
        const categories = Object.keys(foodData);
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    // 渲染食物列表
    function renderFoodList() {
        foodItemsContainer.innerHTML = ''; // 清空现有列表
        const selectedCategory = categorySelect.value;
        const foods = foodData[selectedCategory] || [];

        foods.forEach((food, index) => {
            const li = document.createElement('li');
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = food.name;
            checkbox.checked = true; // 默认选中

            // 添加删除按钮（× 号）
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '×';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.color = 'red';
            deleteButton.style.border = 'none';
            deleteButton.style.background = 'none';
            deleteButton.style.cursor = 'pointer';
            deleteButton.addEventListener('click', function() {
                foodData[selectedCategory] = foodData[selectedCategory].filter(item => item.name !== food.name);
                saveFoods(); // 保存到文件
                renderFoodList();
                updateRoulette();
            });

            // 添加比例输入框
            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.value = food.weight;
            weightInput.min = 1;
            weightInput.addEventListener('change', function() {
                food.weight = parseInt(this.value);
                saveFoods(); // 保存到文件
                updateRoulette();
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${food.name} `));
            label.appendChild(weightInput);
            li.appendChild(label);
            li.appendChild(deleteButton); // 添加删除按钮
            foodItemsContainer.appendChild(li);
        });

        updateRoulette();
    }

    // 保存食物数据到 _data/foods.json
    function saveFoods() {
        const token = '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'; // 替换为你的 GitHub Token
        const repo = 'KiCola.github.io'; // 例如：inzeroworld/blog
        const path = '_data/foods.json'; // 文件路径
        const url = `https://api.github.com/repos/${repo}/contents/${path}`;

        // 获取文件的 SHA
        fetch(url, {
            headers: {
                'Authorization': `token ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const sha = data.sha; // 文件的 SHA
            const content = btoa(JSON.stringify(foodData, null, 2)); // 编码为 Base64

            // 更新文件
            fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: '更新食物列表',
                    content: content,
                    sha: sha
                })
            })
            .then(response => response.json())
            .then(data => console.log('保存成功:', data))
            .catch(error => console.error('保存失败:', error));
        })
        .catch(error => console.error('获取文件 SHA 失败:', error));
    }

    // 添加菜品
    addFoodButton.addEventListener('click', function() {
        const foodName = newFoodInput.value.trim();
        const selectedCategory = categorySelect.value;

        if (foodName && selectedCategory) {
            if (!foodData[selectedCategory]) {
                foodData[selectedCategory] = []; // 如果分类不存在，创建新分类
            }

            // 检查是否已存在同名菜品
            if (!foodData[selectedCategory].some(food => food.name === foodName)) {
                foodData[selectedCategory].push({ name: foodName, weight: 1 }); // 默认比例为 1
                newFoodInput.value = ''; // 清空输入框
                saveFoods(); // 保存到文件
                renderFoodList();
                updateRoulette();
            }
        }
    });

    // 更新转盘
    function updateRoulette() {
        const selectedCategory = categorySelect.value;
        const foods = foodData[selectedCategory] || [];
        const selectedFoods = foods.filter(food => {
            const checkbox = document.querySelector(`input[value="${food.name}"]`);
            return checkbox && checkbox.checked; // 只选中已勾选的食物
        });

        const totalWeight = selectedFoods.reduce((sum, food) => sum + food.weight, 0);
        let startAngle = 0;

        segments = selectedFoods.map((food, index) => {
            const angle = (food.weight / totalWeight) * 360;
            const segment = {
                label: food.name,
                angle: angle,
                color: `hsl(${index * (360 / selectedFoods.length)}, 70%, 50%)`,
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
    spinButton.addEventListener('click', function() {
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

    // 初始化
    loadFoods();
});