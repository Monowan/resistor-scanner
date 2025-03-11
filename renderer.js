let offsetX = 0;
let offsetY = 0;
let scale = 1; // Початковий масштаб
let moveInterval = null;
let zoomInterval = null; // Для зуму

// Функція для завантаження OpenCV
function loadOpenCV() {
    return new Promise((resolve, reject) => {
        if (typeof cv !== 'undefined') {
            resolve(cv); // OpenCV.js вже завантажено
        } else {
            const script = document.createElement('script');
            script.src = 'https://docs.opencv.org/master/opencv.js';
            script.async = true;
            script.onload = () => {
                if (typeof cv !== 'undefined') {
                    resolve(cv); // OpenCV.js завантажено
                } else {
                    reject(new Error('OpenCV не завантажено!'));
                }
            };
            script.onerror = () => reject(new Error('Помилка завантаження OpenCV.js'));
            document.body.appendChild(script);
        }
    });
}

// Обробка вибору файлу з зображенням
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const img = new Image();
        img.onload = function() {
            processImage(img); // Викликається після завантаження зображення
        };
        img.src = URL.createObjectURL(file); // Завантаження зображення
    } else {
        console.log("Файл не вибрано");
    }
});

function processImage(img) {
    loadOpenCV()
        .then(cv => {
            const mat = cv.imread(img);
            const rgbMat = new cv.Mat();
            cv.cvtColor(mat, rgbMat, cv.COLOR_RGBA2RGB);

            const maskRed = new cv.Mat();
            const lowerRed = new cv.Mat(rgbMat.rows, rgbMat.cols, rgbMat.type(), [0, 0, 0, 255]);
            const upperRed = new cv.Mat(rgbMat.rows, rgbMat.cols, rgbMat.type(), [255, 100, 100, 255]);
            cv.inRange(rgbMat, lowerRed, upperRed, maskRed);

            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(maskRed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const resultMat = mat.clone();
            for (let i = 0; i < contours.size(); i++) {
                const rect = cv.boundingRect(contours.get(i));
                if (rect.width > 20 && rect.height > 20) {
                    const color = new cv.Scalar(0, 255, 0, 255);
                    cv.rectangle(resultMat, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), color, 2);
                }
            }

            const container = document.getElementById('imageContainer');
            container.innerHTML = ''; // Прибираємо старе зображення
            const canvas = document.createElement('canvas');
            canvas.id = "canvasOutput";
            container.appendChild(canvas);
            cv.imshow(canvas, resultMat);

            fitImageToContainer(canvas, container);

            mat.delete();
            rgbMat.delete();
            lowerRed.delete();
            upperRed.delete();
            maskRed.delete();
            contours.delete();
            hierarchy.delete();
            resultMat.delete();

        })
        .catch(error => {
            console.error(error.message);
        });
}

// Підгонка під контейнер
function fitImageToContainer(canvas, container) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = Math.min(containerWidth / canvas.width, containerHeight / canvas.height);
    
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
}

// Функція для масштабування зображення
function scaleImage(factor) {
    scale *= factor; // Зміна масштабу

    const canvas = document.getElementById("canvasOutput");
    canvas.style.transform = `scale(${scale})`; // Масштабування зображення

    // Оновлюємо масштаб зображення
    const container = document.getElementById('imageContainer');
    fitImageToContainer(canvas, container);
}

// Функція для початку і зупинки безперервного переміщення
function startMoving(dx, dy) {
    moveInterval = setInterval(() => moveImage(dx, dy), 50); // переміщує кожні 50 мс
}

function stopMoving() {
    clearInterval(moveInterval); // зупиняє переміщення
}

// Функція для переміщення зображення
function moveImage(dx, dy) {
    offsetX += dx;
    offsetY += dy;

    updateImageTransform();
}

function updateImageTransform() {
    const canvas = document.getElementById("canvasOutput");
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`; // Масштаб зображення
}

// Обробка кнопок для переміщення та масштабу
document.getElementById("moveLeft").addEventListener("mousedown", () => startMoving(10, 0));
document.getElementById("moveLeft").addEventListener("mouseup", stopMoving);
document.getElementById("moveLeft").addEventListener("mouseout", stopMoving);

document.getElementById("moveRight").addEventListener("mousedown", () => startMoving(-10, 0));
document.getElementById("moveRight").addEventListener("mouseup", stopMoving);
document.getElementById("moveRight").addEventListener("mouseout", stopMoving);

document.getElementById("moveUp").addEventListener("mousedown", () => startMoving(0, 10));
document.getElementById("moveUp").addEventListener("mouseup", stopMoving);
document.getElementById("moveUp").addEventListener("mouseout", stopMoving);

document.getElementById("moveDown").addEventListener("mousedown", () => startMoving(0, -10));
document.getElementById("moveDown").addEventListener("mouseup", stopMoving);
document.getElementById("moveDown").addEventListener("mouseout", stopMoving);

document.getElementById("resetZoom").addEventListener("click", () => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    updateImageTransform();
});

// Обробка кнопок масштабування
document.getElementById("zoomIn").addEventListener("mousedown", () => {
    zoomInterval = setInterval(() => scaleImage(1.1), 50); // Збільшення на 10% кожні 50 мс
});

document.getElementById("zoomIn").addEventListener("mouseup", () => clearInterval(zoomInterval));
document.getElementById("zoomIn").addEventListener("mouseout", () => clearInterval(zoomInterval));

document.getElementById("zoomOut").addEventListener("mousedown", () => {
    zoomInterval = setInterval(() => scaleImage(0.9), 50); // Зменшення на 10% кожні 50 мс
});

document.getElementById("zoomOut").addEventListener("mouseup", () => clearInterval(zoomInterval));
document.getElementById("zoomOut").addEventListener("mouseout", () => clearInterval(zoomInterval));
