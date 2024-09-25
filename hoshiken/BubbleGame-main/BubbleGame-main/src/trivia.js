window.addEventListener('load', () => {
    const triviaList = [
        "宮崎県は金柑の生産量が日本一。そのまま皮ごと食べられるのが特徴です。",
        "ライチは熱帯果樹のうちの一つ。ジューシーで甘いライチは、美容や健康にも良い果物です。",
        "宮崎県特産の柑橘類で、すだちやかぼすに似た爽やかな酸味が特徴。特に魚料理との相性が抜群です。",
        "宮崎県発祥の柑橘類。白い内皮ごと食べられる珍しい柑橘で、さっぱりとした甘さが特徴です。",
        "宮崎県はピーマンの生産量が全国トップクラス。宮崎の温暖な気候は、ピーマンの栽培に最適です。",
        "ブンタン（文旦）は、柑橘の一種で、酸味と甘みのバランスが良い。宮崎でも特産品として栽培されています。",
        "宮崎のマンゴーは「太陽のタマゴ」として知られるブランド。濃厚な甘さと香りが特長で、贈答品としても人気です。",
        "宮崎県佐土原町で作られるナス。大きめで肉厚な果肉が特徴で、煮物や焼きナスにぴったりです。",
        "宮崎県で生産される黒皮のカボチャ。甘みが強く、煮物やスープにすると美味しいです。",
        "宮崎県では青パパイヤの栽培が盛ん。野菜としてサラダや炒め物に使われ、健康食品として注目されています。",
        "高級メロンの代名詞。宮崎県の温室栽培で作られるアールスメロンは、甘くてジューシーで、見た目も美しいのが特徴です。",
    ];

    const landscapes = [
        { img: 'images/fruits_0.png', description: '金柑' },
        { img: 'images/fruits_1.png', description: 'ライチ' },
        { img: 'images/fruits_2.png', description: 'へべす' },
        { img: 'images/fruits_3.png', description: '日向夏' },
        { img: 'images/fruits_4.png', description: 'ピーマン' },
        { img: 'images/fruits_5.png', description: 'ぶんたん' },
        { img: 'images/fruits_6.png', description: 'マンゴー' },
        { img: 'images/fruits_7.png', description: '佐土原ナス' },
        { img: 'images/fruits_8.png', description: '黒皮南瓜' },
        { img: 'images/fruits_9.png', description: 'パパイヤ' },
        { img: 'images/fruits_10.png', description: 'アールスメロン' },
    ];

    let currentTriviaIndex = 0;
    let currentLandscapeIndex = 0;

    function showNextTrivia() {
        const trivia = triviaList[currentTriviaIndex];
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
        }, 9500);

        currentTriviaIndex = (currentTriviaIndex + 1) % triviaList.length; // 次のトリビアへ、最後までいったら最初に戻る
    }

    function changeLandscape() {
        const landscapeElement = document.getElementById('miyazakiLandscape');
        const descriptionElement = document.getElementById('miyazakiDescription');
        landscapeElement.src = landscapes[currentLandscapeIndex].img;
        descriptionElement.textContent = landscapes[currentLandscapeIndex].description;
        currentLandscapeIndex = (currentLandscapeIndex + 1) % landscapes.length; // 次のランドスケープへ、最後までいったら最初に戻る
    }

    // 10秒ごとに次のトリビアと風景を表示
    setInterval(showNextTrivia, 10000);
    setInterval(changeLandscape, 10000);
});
