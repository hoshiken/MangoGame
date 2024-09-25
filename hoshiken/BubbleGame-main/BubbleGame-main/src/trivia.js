window.addEventListener('load', () => {
    const triviaList = [
        "宮崎県は、日本国内で最も日照時間が長い地域の一つです。",
        "マンゴーは、宮崎の特産品で、ブランド名『太陽のタマゴ』で知られています。",
        "宮崎地鶏『みやざき地頭鶏』は、その歯ごたえと濃厚な旨味で有名です。",
    ];

    const landscapes = [
        { img: 'images/aosima.jpg', description: '宮崎の青島' },
        { img: 'images/udo.jpg', description: '宮崎の鵜戸神宮' },
        { img: 'images/obijouka.jpg', description: '宮崎の伝統的な祭り' },
    ];

    let currentIndex = 0;


    function showRandomTrivia() {
        const trivia = triviaList[Math.floor(Math.random() * triviaList.length)];
        const triviaElement = document.querySelector(".trivia");

        // triviaテキストを空にしてから、一文字ずつspanタグに包む
        triviaElement.innerHTML = ''; // 初期化
        for (let i = 0; i < trivia.length; i++) {
            const span = document.createElement("span");
            span.textContent = trivia[i];
            triviaElement.appendChild(span);

            // アニメーションを遅延させて追加
            span.style.animation = `fadeIn 0.5s ease forwards`;
            span.style.animationDelay = `${i * 0.1}s`; // 0.1秒ごとに次の文字を遅らせて表示
        }

        triviaElement.style.display = "block"; // 表示する

        // 5秒後に非表示
        setTimeout(() => {
            triviaElement.style.display = "none";
        }, 5000);
    }


    setInterval(showRandomTrivia, 10000);


    function changeLandscape() {
        const landscapeElement = document.getElementById('miyazakiLandscape');
        const descriptionElement = document.getElementById('miyazakiDescription');
        landscapeElement.src = landscapes[currentIndex].img;
        descriptionElement.textContent = landscapes[currentIndex].description;
        currentIndex = (currentIndex + 1) % landscapes.length;
      }
      
      setInterval(changeLandscape, 10000); // 5秒ごとに変更
});
