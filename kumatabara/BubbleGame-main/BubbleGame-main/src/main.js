const { Bodies, Body, Composite, Engine, Events, Render, Runner, Sleeping } =
  Matter;

const WIDTH = 420; // 横幅
const HEIGHT = 700; // 高さ
const WALL_T = 10; // 壁の厚さ
const DEADLINE = 650; // ゲームオーバーになる高さ
const FRICTION = 0; // 摩擦
const MASS = 1.1; // 重量
const MAX_LEVEL = 11;
const MAX_FRUITS = 6;
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
let image_number = 0;
let i;


const OBJECT_CATEGORIES = {
  WALL: 0x0001,
  BUBBLE: 0x0002,
  BUBBLE_PENDING: 0x0004,
};

class BubbeGame {
  engine;
  render;
  runner;
  currentBubble = undefined;
  score;
  scoreChangeCallBack;
  gameover = false;
  defaultX = WIDTH / 2;
  message;
  

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
    // バブルの大きさをランダムに決定
    const level = Math.floor(Math.random() * 5);
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

    if(level > MAX_FRUITS-1) {
      renderOptions = {
        fillStyle: BUBBLE_COLORS[level], // レベル2以上は色で描画
        lineWidth: 1
      };
    }
  
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
  
        let renderOptions;
        
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
      
        if(newLevel>MAX_FRUITS-1){
          // それ以外のバブルは通常の色
          renderOptions = {
            fillStyle: BUBBLE_COLORS[newLevel],
            lineWidth: 1
          };
        }
  
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
}

window.onload = () => {
  const container = document.querySelector(".container");
  const message = document.querySelector(".message");
  const onChangeScore = (val) => {
    const score = document.querySelector(".score");
    score.replaceChildren(`Score: ${val}`);
  };
  // とりあえずゲーム作成
  const game = new BubbeGame(container, message, onChangeScore);
  // とりあえず初期化する
  game.init();
};
