document.addEventListener('DOMContentLoaded', function() {
    const foodItemsContainer = document.getElementById('food-items');
    const addFoodButton = document.getElementById('add-food-button');
    const newFoodInput = document.getElementById('new-food');
    const spinButton = document.getElementById('spin-button');
    const canvas = document.getElementById('roulette-wheel');
    const ctx = canvas.getContext('2d');

    // 初始食物列表，包含名称和比例
    let selectedFoods = [
        {
            "肉类": [
                { "name": "白切鸡", "weight": 1, "color": "#ff6f61" },
                { "name": "黄焖鸡", "weight": 2, "color": "#ffcc00" }
            ],
            "蔬菜": [
                { "name": "炒青菜", "weight": 1, "color": "#00cc66" },
                { "name": "凉拌黄瓜", "weight": 2, "color": "#66ccff" }
            ]
        }
    ];

    let segments = [];

    // 添加菜品
    addFoodButton.addEventListener('click', function() {
        const foodName = newFoodInput.value.trim();
        if (foodName && !selectedFoods.some(food => food.name === foodName)) {
            selectedFoods.push({ name: foodName, weight: 1 }); // 默认比例为 1
            newFoodInput.value = ''; // 清空输入框
            renderFoodList();
            updateRoulette();
        }
    });

    // 渲染菜品列表
    function renderFoodList() {
        foodItemsContainer.innerHTML = ''; // 清空现有列表
        selectedFoods.forEach((food, index) => {
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
                selectedFoods = selectedFoods.filter(item => item.name !== food.name);
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
                updateRoulette();
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${food.name} `));
            label.appendChild(weightInput);
            li.appendChild(label);
            li.appendChild(deleteButton); // 添加删除按钮
            foodItemsContainer.appendChild(li);
        });
    }

    // 更新转盘
    function updateRoulette() {
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
    renderFoodList();
    updateRoulette();
});