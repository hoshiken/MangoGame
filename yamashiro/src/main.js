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

const WIDTH = 420; // 横幅
const HEIGHT = 700; // 高さ
const WALL_T = 10; // 壁の厚さ
const DEADLINE = 600; // ゲームオーバーになる高さ
const FRICTION = 0.3; // 摩擦
const MASS = 1; // 重量
const MAX_LEVEL = 11;
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
  nextBubble = undefined; // 次のバブルを保存する変数
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
    Composite.clear(this.engine.world);
    this.resetMessage();
    this.gameover = false;
    this.setScore(0);

    const ground = Bodies.rectangle(WIDTH / 2, HEIGHT - WALL_T / 2, WIDTH, WALL_T, {
      isStatic: true,
      label: "ground",
      render: { fillStyle: WALL_COLOR },
    });
    const leftWall = Bodies.rectangle(WALL_T / 2, HEIGHT / 2, WALL_T, HEIGHT, {
      isStatic: true,
      label: "leftWall",
      render: { fillStyle: WALL_COLOR },
    });
    const rightWall = Bodies.rectangle(WIDTH - WALL_T / 2, HEIGHT / 2, WALL_T, HEIGHT, {
      isStatic: true,
      label: "rightWall",
      render: { fillStyle: WALL_COLOR },
    });
    Composite.add(this.engine.world, [ground, leftWall, rightWall]);
    Runner.run(this.runner, this.engine);

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
    if (this.gameover) return;

    if (this.nextBubble) {
      this.currentBubble = this.nextBubble;
      Composite.add(this.engine.world, [this.currentBubble]);
    }

    const level = Math.floor(Math.random() * 5);
    const radius = level * 10 + 20;

    this.nextBubble = Bodies.circle(this.defaultX, 30, radius, {
      isSleeping: true,
      label: "bubble_" + level,
      friction: FRICTION,
      mass: MASS,
      collisionFilter: {
        group: 0,
        category: OBJECT_CATEGORIES.BUBBLE_PENDING,
        mask: OBJECT_CATEGORIES.WALL | OBJECT_CATEGORIES.BUBBLE,
      },
      render: {
        fillStyle: BUBBLE_COLORS[level],
        lineWidth: 1,
      },
    });

    this.renderNextBubblePreview(radius, BUBBLE_COLORS[level]);
  }

  renderNextBubblePreview(radius, color) {
    const canvas = document.getElementById("nextBubblePreview");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius / 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  putCurrentBubble() {
    if (this.currentBubble) {
      Sleeping.set(this.currentBubble, false);
      this.currentBubble.collisionFilter.category = OBJECT_CATEGORIES.BUBBLE;
      this.currentBubble = undefined;
    }
  }

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
    // ゲーム開始メッセージを表示
    const p = document.createElement("p");
    p.classList.add("mainText");
    p.textContent = "バブルゲーム";

    const p2 = document.createElement("p");
    p2.classList.add("subText");
    p2.textContent = "バブルを大きくしよう";

    // 名前入力フィールドを追加
    const nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("placeholder", "名前を入力してください");
    nameInput.classList.add("name-input");

    // ゲーム開始ボタンを生成
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

    // メッセージエリアに要素を追加
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
    if (this.gameover) return;
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
      if (!Composite.get(this.engine.world, bodyA.id, "body") || !Composite.get(this.engine.world, bodyB.id, "body")) continue;

      const aLevel = +bodyA.label.split("_")[1];
      const bLevel = +bodyB.label.split("_")[1];
      if (aLevel === bLevel && aLevel < MAX_LEVEL) {
        const level = aLevel + 1;
        const radius = level * 10 + 20;

        const mergedBubble = Bodies.circle(bodyA.position.x, bodyA.position.y, radius, {
          friction: FRICTION,
          mass: MASS,
          label: "bubble_" + level,
          collisionFilter: {
            group: 0,
            category: OBJECT_CATEGORIES.BUBBLE,
            mask: OBJECT_CATEGORIES.WALL | OBJECT_CATEGORIES.BUBBLE,
          },
          render: {
            fillStyle: BUBBLE_COLORS[level],
            lineWidth: 1,
          },
        });

        Body.setVelocity(mergedBubble, {
          x: (bodyA.velocity.x + bodyB.velocity.x) / 2,
          y: (bodyA.velocity.y + bodyB.velocity.y) / 2,
        });

        Composite.remove(this.engine.world, [bodyA, bodyB]);
        Composite.add(this.engine.world, [mergedBubble]);

        this.setScore(this.score + (level + 1) * 10);
      }
    }
  }

  handleMouseMove(e) {
    const x = e.offsetX;
    this.defaultX = Math.min(WIDTH - 10, Math.max(10, x));
    if (this.currentBubble) {
      Body.setPosition(this.currentBubble, { x: this.defaultX, y: this.currentBubble.position.y });
    }
  }

  setScore(score) {
    this.score = score;
    this.scoreChangeCallBack(this.score);
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

