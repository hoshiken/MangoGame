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

  start(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.gameStatus === "ready") {
      this.gameStatus = "canput";
      this.createNewBubble();
      this.resetMessage();
    }
  }

  createNewBubble() {
    if (this.gameover) {
        return;
    }

    if (this.nextBubble) {
      this.currentBubble = this.nextBubble;
      Composite.add(this.engine.world, [this.currentBubble]);
    }

    // バブルの大きさをランダムに決定
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


  /*createNewBubble() {
    if (this.gameover) {
      return;
    }
    // バブルの大きさをランダムに決定
    const level = Math.floor(Math.random() * 5);
    const radius = level * 10 + 20;
    const imagePath = `./images/bubble_${level}.png`; // ここに画像パスを設定
  
    // 描画位置のX座標、y座標、円の半径を渡す
    const currentBubble = Bodies.circle(this.defaultX, 30, radius, {
      isSleeping: true,
      label: "bubble_" + level,
      friction: FRICTION,
      mass: MASS,
      collisionFilter: {
        group: 0,
        category: OBJECT_CATEGORIES.BUBBLE_PENDING, // まだ落下位置の決定前なのですでにあるバブルと衝突しないようにする
        mask: OBJECT_CATEGORIES.WALL | OBJECT_CATEGORIES.BUBBLE,
      },
      render: {
        sprite: {
          texture: imagePath,  // 画像パスを指定
          xScale: radius / 50, // 画像サイズをバブルの大きさに合わせる（調整）
          yScale: radius / 50, // 画像サイズをバブルの大きさに合わせる（調整）
        },
      },
    });
    this.currentBubble = currentBubble;
    Composite.add(this.engine.world, [currentBubble]);
  }*/


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
    p.textContent = "バブルゲーム";
    const p2 = document.createElement("p");
    p2.classList.add("subText");
    p2.textContent = "バブルを大きくしよう";
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.classList.add("button");
    button.addEventListener("click", this.start.bind(this));
    button.innerText = "ゲーム開始";
    this.message.appendChild(p);
    this.message.appendChild(p2);
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
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.classList.add("button");
    button.addEventListener("click", this.init.bind(this));
    button.innerText = "もう一度";
    this.message.appendChild(p);
    this.message.appendChild(p2);
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
        if (currentBubbleLevel === 11) {
          // 最大サイズの場合新たなバブルは生まれない
          Composite.remove(this.engine.world, [bodyA, bodyB]);
          continue;
        }
        const newLevel = currentBubbleLevel + 1;
        const newX = (bodyA.position.x + bodyB.position.x) / 2;
        const newY = (bodyA.position.y + bodyB.position.y) / 2;
        const newRadius = newLevel * 10 + 20;
        const newBubble = Bodies.circle(newX, newY, newRadius, {
          label: "bubble_" + newLevel,
          friction: FRICTION,
          mass: MASS,
          collisionFilter: {
            group: 0,
            category: OBJECT_CATEGORIES.BUBBLE,
            mask: OBJECT_CATEGORIES.WALL | OBJECT_CATEGORIES.BUBBLE,
          },
          render: {
            fillStyle: BUBBLE_COLORS[newLevel],
            lineWidth: 1,
          },
        });
        Body.setVelocity(newBubble, { x: 0, y: 0 });
        Body.setPosition(newBubble, { x: newX, y: newY });
        Composite.remove(this.engine.world, [bodyA, bodyB]);
        Composite.add(this.engine.world, [newBubble]);
      }
    }
  }

  setScore(score) {
    this.score = score;
    this.scoreChangeCallBack(this.score);
  }

  handleMouseMove(e) {
    if (!this.currentBubble || this.gameStatus !== "canput") return;
    const x = e.clientX - this.render.canvas.getBoundingClientRect().x;
    const maxX = WIDTH - this.currentBubble.circleRadius;
    const minX = this.currentBubble.circleRadius;
    if (x > minX && x < maxX) {
      Body.setPosition(this.currentBubble, { x, y: this.currentBubble.position.y });
      this.defaultX = x;
    }
  }
}

window.onload = () => {
  const container = document.querySelector(".container");
  const message = document.querySelector(".message");

  const onChangeScore = (val) => {
    const score = document.querySelector(".score");
    score.textContent = `Score: ${val}`;
  };

  // ゲーム作成
  const game = new BubbleGame(container, message, onChangeScore);
  // 初期化する
  game.init();

  const mangoImage = document.getElementById("mangoImage");
  const mangoDescription = document.getElementById("mangoDescription");

  mangoImage.addEventListener("click", () => {
    const isVisible = mangoDescription.style.display === "block";
    mangoDescription.style.display = isVisible ? "none" : "block";
  });
};

