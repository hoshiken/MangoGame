import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// Firebaseの設定（自分のプロジェクト情報に置き換えてください）
const firebaseConfig = {
  apiKey: "AIzaSyBP1BgEN2kyJzp1WtRgiMJvZ7boRSyZYl8",
  authDomain: "mango-game0924.firebaseapp.com",
  databaseURL: "https://mango-game0924-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mango-game0924",
  storageBucket: "mango-game0924.appspot.com",
  messagingSenderId: "226203834944",
  appId: "1:226203834944:web:73720566970a3870575da5",
  measurementId: "G-FX7M7MRM1V"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const { Bodies, Body, Composite, Engine, Events, Render, Runner, Sleeping } =
  Matter;
let i;
let newLevel;
const WIDTH = 420; // 横幅
const HEIGHT = 700; // 高さ
const WALL_T = 10; // 壁の厚さ
const DEADLINE = 690; // ゲームオーバーになる高さ
const FRICTION = 0; // 摩擦
const MASS = 1; // 重量
const MAX_LEVEL = 1.1;
const MAX_FRUITS = 11;
const WALL_COLOR = "#ccc";
const BUBBLE_COLORS = {
  0: "#ff7f7f",
  1: "#ff7fbf",
  2: "#ff7fff",
  3: "#bf7fff",
  4: "#7f7fff",
  5: "#7fbfff",
  6: "#7fffff",
  7: "#7fffbf",
  8: "#7fff7f",
  9: "#bfff7f",
  10: "#ffff7f",
};

const OBJECT_CATEGORIES = {
  WALL: 0x0001,
  BUBBLE: 0x0002,
  BUBBLE_PENDING: 0x0004,
};

class BubbleGame {
  engine;
  render;
  runner;
  currentBubble = undefined;
  score;
  scoreChangeCallBack;
  gameover = false;
  defaultX = WIDTH / 2;
  message;
  
  playerName;

  constructor(container, message, scoreChangeCallBack) {
    this.message = message;
    this.scoreChangeCallBack = scoreChangeCallBack;
    this.engine = Engine.create({
      constraintIterations: 3
    });
    this.render = Render.create({
      element: container,
      engine: this.engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false,
        background: 'transparent',
      },
    });
    this.runner = Runner.create();
    Render.run(this.render);
    container.addEventListener("click", this.handleClick.bind(this));
    container.addEventListener("mousemove", this.handleMouseMove.bind(this));
    Events.on(this.engine, "collisionStart", this.handleCollision.bind(this));
    Events.on(this.engine, "afterUpdate", this.checkGameOver.bind(this));
  }

  init() {
    // リセット時も使うので一旦全部消す
    Composite.clear(this.engine.world);
    this.resetMessage();

    // 状態初期化
    this.gameover = false;
    this.setScore(0);

    // 地面と壁作成
    // 矩形の場合X座標、Y座標、横幅、高さの順に指定、最後にオプションを設定できる
    const ground = Bodies.rectangle(
      WIDTH / 2,
      HEIGHT - WALL_T / 2,
      WIDTH,
      WALL_T,
      {
        isStatic: true,
        label: "ground",
        render: {
          fillStyle: WALL_COLOR,
        },
      }
    );
    const leftWall = Bodies.rectangle(WALL_T / 2, HEIGHT / 2, WALL_T, HEIGHT, {
      isStatic: true,
      label: "leftWall",
      render: {
        fillStyle: WALL_COLOR,
      },
    });
    const rightWall = Bodies.rectangle(
      WIDTH - WALL_T / 2,
      HEIGHT / 2,
      WALL_T,
      HEIGHT,
      {
        isStatic: true,
        label: "rightWall",
        render: {
          fillStyle: WALL_COLOR,
        },
      }
    );
    // 地面と壁を描画
    Composite.add(this.engine.world, [ground, leftWall, rightWall]);
    Runner.run(this.runner, this.engine);

    // ステータスをゲーム準備完了に
    this.gameStatus = "ready";
    this.showReadyMessage();
  }

  start(playerName) {
    this.playerName = playerName; // プレイヤー名を保存
    this.message.style.display = "none"; // メッセージを非表示
    this.gameStatus = "canput"; // ゲームステータスを変更
    this.createNewBubble(); // 新しいバブルを作成
    this.resetMessage(); // メッセージをリセット
    this.addToRanking(this.playerName, 0); // 名前と初期スコアをランキングに追加
  }

  createNewBubble() {
    if (this.gameover) {
      return;
    }
    // バブルの大きさをランダムに決定
    const level = 9//Math.floor(Math.random() * 5);
    console.log(level);
    const radius = level * 10 + 20;
  
    let renderOptions;
    // レベルそれぞれで画像を表示
    for(i=0; i<MAX_FRUITS; i++){
      if(level === i) {
        renderOptions = {
          sprite: {
            texture: `./images/fruits_${i}.png`, // レベル0のバブルの画像パス
            xScale: radius / 500, // 実際の画像の幅に応じてスケールを調整
            yScale: radius / 500 // 実際の画像の高さに応じてスケールを調整
          }
        };
      }
    }

    // if(level > MAX_FRUITS-1) {
    //   renderOptions = {
    //     fillStyle: BUBBLE_COLORS[level], // レベル2以上は色で描画
    //     lineWidth: 1
    //   };
    // }
  
    // 描画位置のX座標、Y座標、円の半径を渡す
    const currentBubble = Bodies.circle(this.defaultX, 30, radius, {
      isSleeping: true,
      label: "bubble_" + level,
      friction: FRICTION,
      mass: MASS/(level+1),
      collisionFilter: {
        group: 0,
        category: OBJECT_CATEGORIES.BUBBLE_PENDING, // まだ落下位置の決定前なのですでにあるバブルと衝突しないようにする
        mask: OBJECT_CATEGORIES.WALL | OBJECT_CATEGORIES.BUBBLE,
      },
      render: renderOptions,
    });
  
    this.currentBubble = currentBubble;
    Composite.add(this.engine.world, [currentBubble]);
  }
  

  putCurrentBubble() {
    if (this.currentBubble) {
      Sleeping.set(this.currentBubble, false);
      this.currentBubble.collisionFilter.category = OBJECT_CATEGORIES.BUBBLE;
      this.currentBubble = undefined;
    }
  }

  // ゲームオーバー判定
  // 本家がどうしてるかわからないけど一定以上の高さに上方向の速度を持つオブジェクトが存在している場合ゲームオーバーとする
  checkGameOver() {
    const bubbles = Composite.allBodies(this.engine.world).filter((body) =>
      body.label.startsWith("bubble_")
    );
    for (const bubble of bubbles) {
      if (bubble.position.y < HEIGHT - DEADLINE && bubble.velocity.y < 0) {
        Runner.stop(this.runner);
        this.gameover = true;
        this.showGameOverMessage();
        break;
      }
    }
  }

  showReadyMessage() {
    const p = document.createElement("p");
    p.classList.add("mainText");
    p.textContent = "マンゴーゲーム";
    const p2 = document.createElement("p");
    p2.classList.add("subText");
    p2.textContent = "宮崎の特産品を知ってみよう";
    // 名前入力フィールドを追加
    const nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("placeholder", "名前を入力してください");
    nameInput.classList.add("name-input");

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.classList.add("button");
    button.innerText = "ゲーム開始";
    // ゲーム開始ボタンのクリックイベント
    button.addEventListener("click", () => {
      const playerName = nameInput.value; // 入力された名前を取得
      if (playerName) {
        this.start(playerName); // 名前を引数としてstartメソッドを呼び出し
      } else {
        alert("名前を入力してください。");
      }
    });
    this.message.appendChild(p);
    this.message.appendChild(p2);
    this.message.appendChild(nameInput);
    this.message.appendChild(button);
    this.message.style.display = "block";
  }

  showGameOverMessage() {
    const p = document.createElement("p");
    p.classList.add("mainText");
    p.textContent = "Game Over";
    const p2 = document.createElement("p");
    p2.classList.add("subText");
    p2.textContent = `Score: ${this.score}`;

    const submitButton = document.createElement("button");
    submitButton.textContent = "スコア送信";
    submitButton.classList.add("button");
    submitButton.addEventListener("click", () => {
      submitScoreToFirebase(this.playerName, this.score); // ここでplayerNameを送信
      this.resetMessage(); // メッセージをリセット
      this.init(); // ゲームを初期化して再開
    });

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.classList.add("button");
    button.addEventListener("click", () => {
      this.init(); // ゲームを初期化
      this.setScore(0); // スコアをゼロにリセット
      this.start(this.playerName); // 同じ名前で再スタート
    });
    button.innerText = "もう一度";
    this.message.appendChild(p);
    this.message.appendChild(p2);
    this.message.appendChild(submitButton);
    this.message.appendChild(button);
    this.message.style.display = "block";
  }

  resetMessage() {
    this.message.replaceChildren();
    this.message.style.display = "none";
  }

  handleClick() {
    if (this.gameover) {
      return;
    }
    if (this.gameStatus === "canput") {
      this.putCurrentBubble();
      this.gameStatus = "interval";
      setTimeout(() => {
        this.createNewBubble();
        this.gameStatus = "canput";
      }, 500);
    }
  }

  handleCollision({ pairs }) {
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;
      // 既に衝突して消滅済みのバブルについての判定だった場合スキップ
      if (
        !Composite.get(this.engine.world, bodyA.id, "body") ||
        !Composite.get(this.engine.world, bodyB.id, "body")
      ) {
        continue;
      }
      if (bodyA.label === bodyB.label && bodyA.label.startsWith("bubble_")) {
        const currentBubbleLevel = Number(bodyA.label.substring(7));
        // スコア加算
        this.setScore(this.score + 2 ** currentBubbleLevel);
        
        if (currentBubbleLevel === 10) {
          // 最大サイズの場合新たなバブルは生まれない
          Composite.remove(this.engine.world, [bodyA, bodyB]);
          continue;
        }
  
        if(currentBubbleLevel<10){
          newLevel = currentBubbleLevel + 1;
        }
        const newX = (bodyA.position.x + bodyB.position.x) / 2;
        const newY = (bodyA.position.y + bodyB.position.y) / 2;
        const newRadius = newLevel * 10 + 20;
  
        let renderOptions;
  
        // レベル0同士が衝突してレベル1が生成された場合、画像を使う
        for(i=0; i<MAX_FRUITS; i++){
          if (currentBubbleLevel === i && newLevel === i+1) {
            renderOptions = {
              sprite: {
                texture: `./images/fruits_${newLevel}.png`, // バブルの画像パス
                xScale: newRadius / 500, // 実際の画像の幅に応じてスケールを調整
                yScale: newRadius / 500 // 実際の画像の高さに応じてスケールを調整
              }
            };
          }
      }
      
        // if(newLevel>MAX_FRUITS-1){
        //   // それ以外のバブルは通常の色
        //   renderOptions = {
        //     fillStyle: BUBBLE_COLORS[newLevel],
        //     lineWidth: 1
        //   };
        // }
  
        const newBubble = Bodies.circle(newX, newY, newRadius, {
          label: "bubble_" + newLevel,
          friction: FRICTION,
          mass: MASS/(newLevel+1),
          collisionFilter: {
            group: 0,
            category: OBJECT_CATEGORIES.BUBBLE,
            mask: OBJECT_CATEGORIES.WALL | OBJECT_CATEGORIES.BUBBLE,
          },
          render: renderOptions,
        });
  
        Composite.remove(this.engine.world, [bodyA, bodyB]);
        Composite.add(this.engine.world, [newBubble]);
      }
    }
  }
  

  // 落とすバブルのX位置を移動する
  handleMouseMove(e) {
    if (this.gameStatus !== "canput" || !this.currentBubble) {
      return;
    }
    const { offsetX } = e;
    const currentBubbleRadius =
      Number(this.currentBubble.label.substring(7)) * 10 + 20;
    const newX = Math.max(
      Math.min(offsetX, WIDTH - 10 - currentBubbleRadius),
      10 + currentBubbleRadius
    );
    Body.setPosition(this.currentBubble, {
      x: newX,
      y: this.currentBubble.position.y,
    });
    this.defaultX = newX;
  }

  setScore(score) {
    this.score = score;
    if (this.scoreChangeCallBack) {
      this.scoreChangeCallBack(score);
    }
  }

  addToRanking(name, score) {
    if (score === 0) return; // スコアがゼロのときは何もしない

    const rankingList = document.getElementById("rankingList");
    const listItem = document.createElement("li");
    listItem.textContent = `${name}: ${score}`;
    rankingList.appendChild(listItem);
  }
}

window.onload = function () {
  const container = document.querySelector(".container");
  const message = document.querySelector(".message");
  const score = document.querySelector(".score"); // score を取得

  if (container && message && score) { // 要素が存在するか確認
    const game = new BubbleGame(container, message, (s) => (score.textContent = s));
    game.init();
    displayRanking(); // ランキング表示
  } else {
    console.error("必要なHTML要素が見つかりません。");
  }
};

function submitScoreToFirebase(playerName, score) {
  const dbRef = ref(db, "scores");
  const newScoreRef = push(dbRef);
  set(newScoreRef, {
    playerName: playerName, // プレイヤーの名前を保存
    score: score,
    timestamp: new Date().toISOString(),
  }).then(() => {
    alert("スコアが送信されました！");
  }).catch((error) => {
    alert("スコアの送信に失敗しました: " + error);
  });
}

function displayRanking() {
  const scoresRef = ref(db, "scores");
  onValue(scoresRef, (snapshot) => {
    const scores = snapshot.val();
    const rankingList = document.getElementById("rankingList");
    rankingList.innerHTML = "";

    const sortedScores = Object.values(scores || {}).sort((a, b) => b.score - a.score);

    sortedScores.slice(0, 5).forEach((score, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}位: ${score.playerName} - ${score.score}点`; // 名前を追加
      rankingList.appendChild(li);
    });
  });
}


