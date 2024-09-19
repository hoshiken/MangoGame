// クリックイベントを追加
document.addEventListener('click', function(event) {
    // クリックした場所の座標を取得
    const x = event.clientX;
    const y = event.clientY;

    // 画像要素を作成
    const img = document.createElement('img');
    img.src = 'https://example.com/image.png';  // 表示する画像のURL
    img.style.position = 'absolute';
    img.style.width = '100px';   // 画像の幅
    img.style.height = '100px';  // 画像の高さ

    // 画像の中心をクリックした場所に配置するための調整
    img.style.left = (x - 50) + 'px';  // 100px幅の半分を引く
    img.style.top = (y - 50) + 'px';   // 100px高さの半分を引く

    // 画像をページに追加
    document.body.appendChild(img);
});
