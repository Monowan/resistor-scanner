function loadOpenCV() {
    return new Promise((resolve, reject) => {
        if (typeof cv !== 'undefined') {
            console.log("OpenCV завантажено!");
            resolve(cv); // OpenCV.js вже завантажено
        } else {
            console.log("Завантаження OpenCV.js...");
            const script = document.createElement('script');
            script.src = 'https://docs.opencv.org/master/opencv.js';
            script.async = true;
            script.onload = () => {
                if (typeof cv !== 'undefined') {
                    console.log("OpenCV завантажено!");
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
        console.log("Файл вибрано:", file.name);
    } else {
        console.log("Файл не вибрано");
    }
});



function processImage(img) {
    console.log("Обробка зображення...");
    loadOpenCV()
        .then(cv => {
            // Завантажуємо зображення в матрицю
            const mat = cv.imread(img);
            console.log("Зображення завантажено в матрицю");

            // Перетворюємо зображення в формат RGB
            const rgbMat = new cv.Mat();
            console.log("Перетворення в RGB...");
            cv.cvtColor(mat, rgbMat, cv.COLOR_RGBA2RGB);  // Перетворюємо в RGB
            console.log("Зображення перетворено в RGB");

            // Створюємо маску для червоного кольору в RGB
            const lowerRed = new cv.Mat(rgbMat.rows, rgbMat.cols, rgbMat.type(), [0, 0, 0, 255]); // мінімальний червоний
            const upperRed = new cv.Mat(rgbMat.rows, rgbMat.cols, rgbMat.type(), [255, 100, 100, 255]); // максимальний червоний
            console.log("Маска для червоних смужок створена");

            // Створюємо маску для червоних смужок
            const maskRed = new cv.Mat();
            console.log("Створюється маска для червоних смужок...");
            cv.inRange(rgbMat, lowerRed, upperRed, maskRed);
            console.log("Маска червоних смужок створена");

            // Заливка маски жовтим
            const yellowColor = [0, 255, 255, 255]; // Жовтий колір для заливки з альфа-каналом
            const yellowScalar = new cv.Scalar(yellowColor[0], yellowColor[1], yellowColor[2], yellowColor[3]); // Жовтий для альфа-каналу
            const yellowMat = new cv.Mat(rgbMat.rows, rgbMat.cols, rgbMat.type(), yellowColor); // Матриця для жовтого кольору
            console.log("Заливка маски жовтим...");
            cv.bitwise_and(yellowMat, yellowMat, yellowMat, maskRed); // Використовуємо маску для заливки тільки червоних областей жовтим

            // Виводимо маску в консоль для перевірки
            console.log("Маска червоних смужок:");
            console.log(maskRed);

            // Знаходимо контури на масці
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            console.log("Пошук контурів...");
            cv.findContours(maskRed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            console.log("Кількість знайдених контурів:", contours.size());

            // Обводимо знайдені контури прямокутниками на оригінальному зображенні
            const resultMat = mat.clone();
            console.log("Обводимо знайдені контури...");
            let largeRectanglesCount = 0;  // Лічильник великих прямокутників
            for (let i = 0; i < contours.size(); i++) {
                // Отримуємо прямокутник, що охоплює контур
                const rect = cv.boundingRect(contours.get(i));
                console.log("Прямокутник:", rect);

                // Перевірка на розмір прямокутника (фільтруємо дуже маленькі прямокутники)
                if (rect.width > 20 && rect.height > 20) {  // Мінімальний розмір для прямокутників
                    // Виводимо в консоль координати прямокутника для перевірки
                    console.log("Великий прямокутник:", rect);

                    // Малюємо великий прямокутник на результаті
                    const color = [0, 255, 0]; // Зелений колір для обведення великих прямокутників
                    const scalarColor = new cv.Scalar(color[0], color[1], color[2], 255); // Три елементи для RGB, 255 для альфа-каналу
                    cv.rectangle(resultMat, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), scalarColor, 2); // Малюємо прямокутник на зображенні
                    largeRectanglesCount++;
                } else {
                    console.log("Маленький прямокутник, замальовуємо синім:", rect);
                    // Малюємо маленький прямокутник синім кольором
                    const blueColor = [255, 0, 0, 255]; // Синій колір для замальовування маленьких прямокутників
                    const blueScalar = new cv.Scalar(blueColor[0], blueColor[1], blueColor[2], blueColor[3]); // Синій для альфа-каналу
                    cv.rectangle(resultMat, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), blueScalar, -1); // Малюємо замальований прямокутник
                }
            }

            console.log("Кількість великих прямокутників знайдено:", largeRectanglesCount);

            // Виводимо результат на canvas
            console.log("Виведення результату на canvas...");
            cv.imshow('canvasOutput', resultMat);

            // Звільняємо пам'ять
            mat.delete();
            rgbMat.delete();
            lowerRed.delete();
            upperRed.delete();
            maskRed.delete();
            contours.delete();
            hierarchy.delete();
            yellowMat.delete();  // Очищаємо жовту матрицю

            console.log("Зображення оброблене!");
        })
        .catch(error => {
            console.error(error.message);
        });
}

