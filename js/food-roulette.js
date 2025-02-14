document.addEventListener('DOMContentLoaded', function() {
    const foodItemsContainer = document.getElementById('food-items');
    const addFoodButton = document.getElementById('add-food-button');
    const newFoodInput = document.getElementById('new-food');
    const spinButton = document.getElementById('spin-button');
    const canvas = document.getElementById('roulette-wheel');
    const ctx = canvas.getContext('2d');

    let selectedFoods = [];
    let segments = [];

    // 从文件加载初始菜品
    function loadFoodsFromFile() {
        fetch('/_data/foods.json')
            .then(response => response.json())
            .then(foods => {
                selectedFoods = foods;
                renderFoodList();
                updateRoulette();
            })
            .catch(error => console.error('加载菜品失败:', error));
    }

    // 从 localStorage 加载用户添加的菜品
    function loadFoodsFromLocalStorage() {
        const savedFoods = JSON.parse(localStorage.getItem('userFoods')) || [];
        selectedFoods = selectedFoods.concat(savedFoods);
        renderFoodList();
        updateRoulette();
    }

    // 添加菜品
    addFoodButton.addEventListener('click', function() {
        const foodName = newFoodInput.value.trim();
        if (foodName && !selectedFoods.includes(foodName)) {
            selectedFoods.push(foodName);
            newFoodInput.value = ''; // 清空输入框
            renderFoodList();
            updateRoulette();
            saveFoodsToLocalStorage();
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
            checkbox.value = food;
            checkbox.checked = true; // 默认选中
            checkbox.addEventListener('change', function() {
                if (!this.checked) {
                    selectedFoods = selectedFoods.filter(item => item !== food);
                    renderFoodList();
                    updateRoulette();
                    saveFoodsToLocalStorage();
                }
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${food}`));
            li.appendChild(label);
            foodItemsContainer.appendChild(li);
        });
    }

    // 更新转盘
    function updateRoulette() {
        segments = selectedFoods.map((food, index) => {
            return {
                label: food,
                angle: 360 / selectedFoods.length,
                color: `hsl(${index * (360 / selectedFoods.length)}, 70%, 50%)`
            };
        });
        drawRoulette();
    }

    // 绘制转盘
    function drawRoulette() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let startAngle = 0;
        segments.forEach(segment => {
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 200, startAngle * Math.PI / 180, (startAngle + segment.angle) * Math.PI / 180);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.stroke();
            startAngle += segment.angle;
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
                alert(`恭喜你选中了: ${winningSegment.label}`);
            }
        }
        requestAnimationFrame(animate);
    }

    // 保存用户添加的菜品到 localStorage
    function saveFoodsToLocalStorage() {
        const userFoods = selectedFoods.filter(food => !foodsFromFile.includes(food));
        localStorage.setItem('userFoods', JSON.stringify(userFoods));
    }

    // 初始化
    let foodsFromFile = [];
    loadFoodsFromFile();
    loadFoodsFromLocalStorage();
});