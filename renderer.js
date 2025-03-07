document.getElementById('fileInput').addEventListener('change', function(event) {
    console.log("File selected:", event.target.files[0].name);

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const imgElement = new Image();
        imgElement.src = e.target.result;
        
        imgElement.onload = function() {
            console.log("Image loaded successfully!");

            // Перевірка завантаження OpenCV.js
            console.log("OpenCV.js loading...");
            setTimeout(() => {
                if (cv && cv.imread) {
                    console.log("OpenCV.js loaded successfully!");
                    detectResistors(imgElement);
                } else {
                    console.error("OpenCV.js failed to load!");
                }
            }, 3000);
        };
    };

    reader.readAsDataURL(file);
});

function detectResistors(imgElement) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Обрізаємо canvas по розміру зображення
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    
    let src = cv.imread(imgElement);
    let dst = new cv.Mat();
    
    console.log("Starting contour detection...");
    
    // Перетворення зображення в сірих тонах
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    
    // Пошук контурів
    let contours = [];
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    // Виведення контурів на canvas
    cv.drawContours(dst, contours, -1, [255, 0, 0, 255], 1);
    
    console.log("Contours drawn on canvas");
    
    // Показуємо результат на canvas
    cv.imshow(canvas, dst);
    
    // Очищення ресурсів
    src.delete();
    dst.delete();
    hierarchy.delete();
}
