import type Phaser from "phaser";
import { ACTION_TEXT, type ActionId, type EventChoice, isFinished, type ItemKind, ITEMS, judge, type Result, TEA_SECONDS } from "./rules";
import { bustKey, headKey, type Look, PASSENGER_LOOKS, SPEAKERS, type Speaker, type Sprites } from "./sprites";

// Сцена мини-игры «Бесхозная вещь»: вагон сверху, проводник идёт по проходу и ищет оставленную
// вещь. Что именно найдётся — сумка, рюкзак, коробка с запахом гари или игрушка — решает случай,
// и правильный ответ у каждой находки свой (rules.ts). Персонажи — спрайты из сценариев (sprites.tsx).
// Phaser передаётся параметром: библиотека грузится в браузере только на странице игры

type PhaserLib = typeof Phaser;

const WIDTH = 480;
const HEIGHT = 800;
const TIME_LIMIT_S = 45;
const ROWS = 10;
const ROW_Y0 = 132;
const ROW_STEP = 60;
// Центры кресел: две пары слева и справа от прохода
const SEAT_X = [86, 146, 334, 394];
const AISLE_X = 240;
const AISLE_TOP = 120;
const AISLE_BOTTOM = 740;
// Вещь можно осмотреть, только подойдя к её ряду
const REACH_Y = 45;
// Скорость проводника, пикселей в миллисекунду
const WALK_SPEED = 0.45;
// Сумки с владельцами рядом — отвлекающие
const ATTENDED_BAGS = 4;

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const COLORS = {
  floor: 0xe9edf3,
  wall: 0xc5cbd4,
  aisle: 0xf6f7f9,
  seat: 0x3d5a87,
  headrest: 0xf3f5f7,
  graphite: 0x15171c,
  uniform: 0x23406b,
  scarf: 0x2a9d8f,
};
const COATS = [0x7a7f87, 0xc0674a, 0x5e8f6a, 0x8a6fb0, 0xc9892f, 0xb0506e];
const BAGS = [0x8a5a3c, 0x2f3b4a, 0x6d3a5b, 0x4f6284];

interface Seat {
  x: number;
  y: number;
}

interface Passenger {
  seat: Seat;
  look: Look;
  parts: Phaser.GameObjects.GameObject[];
  head: Phaser.GameObjects.Image;
}

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createUnattendedItemGame(P: PhaserLib, parent: HTMLElement, sprites: Sprites, onFinish: (result: Result) => void): Phaser.Game {
  class InspectionScene extends P.Scene {
    private readonly kind: ItemKind = pick(Object.keys(ITEMS) as ItemKind[]);
    // Событие партии: пассажир хочет сам унести опасную вещь или просит чай посреди осмотра
    private readonly plannedEvent: EventChoice["id"] | null =
      ITEMS[this.kind].grabbable && Math.random() < 0.5 ? "grab" : Math.random() < 0.6 ? "tea" : null;
    private event?: EventChoice;
    private conductor!: Phaser.GameObjects.Container;
    private walk?: Phaser.Tweens.Tween;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private timerText!: Phaser.GameObjects.Text;
    private hintText!: Phaser.GameObjects.Text;
    private clock?: Phaser.Time.TimerEvent;
    private item!: { seat: Seat; body: Phaser.GameObjects.GameObject[] };
    private passengers: Passenger[] = [];
    private secondsLeft = TIME_LIMIT_S;
    private started = false;
    private found = false;
    private over = false;
    private paused = false;
    private wrongTaps = 0;
    private actions: ActionId[] = [];

    constructor() {
      super("inspection");
    }

    create() {
      for (const [key, image] of sprites) {
        if (!this.textures.exists(key)) this.textures.addImage(key, image);
      }
      this.drawCar();
      this.placeEverything();
      this.conductor = this.drawConductor();
      this.drawHud();
      this.cursors = this.input.keyboard?.createCursorKeys();
      // Касание пустого места — проводник идёт к этой точке прохода
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (this.canWalk() && over.length === 0) this.walkTo(pointer.y);
      });
      this.showIntro();
    }

    update(_time: number, delta: number) {
      if (!this.canWalk() || !this.cursors) return;
      const direction = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0);
      if (direction === 0) return;
      this.walk?.stop();
      this.conductor.y = P.Math.Clamp(this.conductor.y + direction * WALK_SPEED * delta, AISLE_TOP, AISLE_BOTTOM);
    }

    private canWalk() {
      return this.started && !this.found && !this.over && !this.paused;
    }

    // ---------- вагон, пассажиры, находка ----------

    private drawCar() {
      this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 40, 430, 700, COLORS.floor).setStrokeStyle(6, COLORS.wall);
      this.add.rectangle(AISLE_X, HEIGHT / 2 + 40, 110, 690, COLORS.aisle);
      for (let row = 0; row < ROWS; row++) {
        const y = ROW_Y0 + row * ROW_STEP;
        this.add.rectangle(28, y, 6, 36, 0x9fc3e0);
        this.add.rectangle(452, y, 6, 36, 0x9fc3e0);
        for (const x of SEAT_X) {
          this.add.rectangle(x, y, 50, 46, COLORS.seat);
          this.add.rectangle(x, y - 19, 36, 8, COLORS.headrest);
        }
      }
      // Тамбур с дверью в конце вагона
      this.add.rectangle(AISLE_X, 772, 90, 10, COLORS.graphite);
    }

    // Находка — в паре кресел, где никого нет (игрушка — в проходе), не в последних рядах, чтобы до
    // неё нужно было дойти. У рюкзака и коробки рядом сидит тот, кто подскажет. Ещё несколько сумок
    // лежат рядом с владельцами — они отвлекают
    private placeEverything() {
      const pairs = shuffle(Array.from({ length: ROWS * 2 }, (_, index) => ({ row: Math.floor(index / 2), side: index % 2 })));
      const target = pairs.splice(
        pairs.findIndex((pair) => pair.row < ROWS - 3),
        1,
      )[0];
      const seatsOf = (pair: { row: number; side: number }): [Seat, Seat] => {
        const y = ROW_Y0 + pair.row * ROW_STEP;
        return [
          { x: SEAT_X[pair.side * 2], y },
          { x: SEAT_X[pair.side * 2 + 1], y },
        ];
      };

      const rule = ITEMS[this.kind];
      const [itemSeat, besideSeat] = shuffle(seatsOf(target));
      if (rule.clue) this.drawPassenger(besideSeat, SPEAKERS[rule.clue.speaker].look);
      const spot = this.kind === "toy" ? { x: AISLE_X + P.Math.Between(-25, 25), y: itemSeat.y + 30 } : itemSeat;
      this.item = { seat: spot, body: this.drawItem(this.kind, spot) };

      pairs.forEach((pair, index) => {
        const [a, b] = shuffle(seatsOf(pair));
        if (index < ATTENDED_BAGS) {
          const owner = this.drawPassenger(a, pick(PASSENGER_LOOKS));
          this.drawBag(b, pick(BAGS), () => this.inspectAttended(b, owner));
          return;
        }
        if (Math.random() < 0.5) this.drawPassenger(a, pick(PASSENGER_LOOKS));
        if (Math.random() < 0.4) this.drawPassenger(b, pick(PASSENGER_LOOKS));
      });
    }

    private drawPassenger(seat: Seat, look: Look): Passenger {
      const body = this.add.ellipse(seat.x, seat.y + 10, 40, 26, pick(COATS));
      const head = this.add.image(seat.x, seat.y - 4, headKey(look, "calm")).setDisplaySize(26, 36);
      const passenger = { seat, look, parts: [body, head], head };
      this.passengers.push(passenger);
      return passenger;
    }

    private drawBag(seat: Seat, color: number, onTap: () => void) {
      this.add.rectangle(seat.x, seat.y - 12, 14, 5, color).setStrokeStyle(1, 0x000000, 0.25);
      const body = this.add.rectangle(seat.x, seat.y + 2, 32, 24, color).setStrokeStyle(2, 0x000000, 0.2);
      this.tappable(body, 32, 24, seat, onTap);
      return [body];
    }

    // Внешний вид находки подсказывает, что это: у коробки идёт дым, рюкзак со светоотражателем
    private drawItem(kind: ItemKind, spot: Seat): Phaser.GameObjects.GameObject[] {
      const onTap = () => this.inspectItem();
      if (kind === "bag") return this.drawBag(spot, 0x6b4a34, onTap);
      if (kind === "backpack") {
        const body = this.add.rectangle(spot.x, spot.y + 2, 28, 30, 0x2f6b4f).setStrokeStyle(2, 0x000000, 0.2);
        const pocket = this.add.rectangle(spot.x, spot.y + 8, 18, 10, 0x285c43);
        const reflector = this.add.rectangle(spot.x, spot.y - 6, 18, 3, 0xffb020);
        this.tappable(body, 28, 30, spot, onTap);
        return [body, pocket, reflector];
      }
      if (kind === "smoke") {
        const body = this.add.rectangle(spot.x, spot.y + 2, 30, 26, 0xc9a877).setStrokeStyle(2, 0x8a6a3c, 0.6);
        const tape = this.add.rectangle(spot.x, spot.y + 2, 30, 4, 0xa88a5a);
        const wire = this.add.line(0, 0, spot.x + 8, spot.y + 10, spot.x + 20, spot.y + 18, 0xd63b3b).setOrigin(0, 0).setLineWidth(2);
        this.tappable(body, 30, 26, spot, onTap);
        // Струйка дыма: серые клубы поднимаются и тают — видно издалека
        this.time.addEvent({
          delay: 450,
          loop: true,
          callback: () => {
            const puff = this.add.circle(spot.x + P.Math.Between(-6, 6), spot.y - 8, P.Math.Between(4, 7), 0x8a919c, 0.55);
            this.tweens.add({ targets: puff, y: puff.y - 40, alpha: 0, scale: 2, duration: 1600, onComplete: () => puff.destroy() });
          },
        });
        return [body, tape, wire];
      }
      // Игрушка: плюшевый мишка в проходе
      const body = this.add.circle(spot.x, spot.y + 4, 10, 0xc9892f);
      const head = this.add.circle(spot.x, spot.y - 8, 7, 0xc9892f);
      const ears = [this.add.circle(spot.x - 6, spot.y - 13, 3, 0xa86d20), this.add.circle(spot.x + 6, spot.y - 13, 3, 0xa86d20)];
      this.tappable(body, 20, 20, spot, onTap);
      return [body, head, ...ears];
    }

    private tappable(shape: Phaser.GameObjects.Shape, width: number, height: number, spot: Seat, onTap: () => void) {
      shape.setInteractive({ hitArea: new P.Geom.Rectangle(0, 0, width, height), hitAreaCallback: P.Geom.Rectangle.Contains, useHandCursor: true });
      shape.on("pointerdown", () => {
        if (this.canWalk()) this.walkTo(spot.y, onTap);
      });
    }

    private drawConductor() {
      return this.add.container(AISLE_X, AISLE_BOTTOM, [
        this.add.ellipse(0, 12, 44, 28, COLORS.uniform),
        this.add.circle(0, 5, 5, COLORS.scarf),
        this.add.image(0, -4, headKey("conductor", "calm")).setDisplaySize(28, 39),
      ]);
    }

    // ---------- интерфейс ----------

    private drawHud() {
      this.add.rectangle(WIDTH / 2, 44, WIDTH, 88, COLORS.graphite);
      this.add.text(20, 16, "Осмотр салона · вагон 5", { fontFamily: FONT, fontSize: "18px", fontStyle: "bold", color: "#ffffff" });
      this.hintText = this.add.text(20, 46, "Найдите оставленную вещь", { fontFamily: FONT, fontSize: "14px", color: "#b9c0cc", wordWrap: { width: 330 } });
      this.timerText = this.add
        .text(WIDTH - 20, 18, this.formatTime(), { fontFamily: "ui-monospace, monospace", fontSize: "26px", fontStyle: "bold", color: "#ffb020" })
        .setOrigin(1, 0);
    }

    private formatTime() {
      return `0:${String(Math.max(0, this.secondsLeft)).padStart(2, "0")}`;
    }

    private showIntro() {
      const layer = this.add.container(0, 0);
      const shade = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55).setInteractive();
      const panel = this.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(30, 230, WIDTH - 60, 330, 18);
      const text = this.add.text(
        54,
        256,
        "Пассажиры сообщают: в салоне оставлена чья-то вещь.\n\nНайдите её и решите, что делать. Правильный ответ зависит от того, что это за вещь. На осмотр — 45 секунд.",
        { fontFamily: FONT, fontSize: "17px", color: "#15171c", wordWrap: { width: WIDTH - 108 }, lineSpacing: 4 },
      );
      const button = this.makeButton(WIDTH / 2, 510, WIDTH - 108, 56, "Начать осмотр", 0x1f5bff, "#ffffff", () => {
        layer.destroy();
        this.start();
      });
      layer.add([shade, panel, text, button]);
    }

    private makeButton(x: number, y: number, width: number, height: number, label: string, fill: number, color: string, onPress: () => void) {
      const background = this.add.rectangle(0, 0, width, height, fill).setStrokeStyle(2, 0x15171c, 0.12);
      const text = this.add
        .text(0, 0, label, { fontFamily: FONT, fontSize: "15px", color, align: "center", wordWrap: { width: width - 32 } })
        .setOrigin(0.5);
      background.setInteractive({ hitArea: new P.Geom.Rectangle(0, 0, width, height), hitAreaCallback: P.Geom.Rectangle.Contains, useHandCursor: true });
      const container = this.add.container(x, y, [background, text]);
      background.on("pointerdown", () => {
        this.tweens.add({ targets: container, scale: 0.97, yoyo: true, duration: 80 });
        onPress();
      });
      return container;
    }

    // Диалог в стиле новеллы: бюст говорящего над нижней панелью, реплика и варианты ответа
    private dialog(speaker: Speaker, phrase: string, options: { label: string; onPick: () => void }[]) {
      const who = SPEAKERS[speaker];
      const top = HEIGHT - 110 - options.length * 70;
      const layer = this.add.container(0, 0);
      const close = () => layer.destroy();
      layer.add([
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.45).setInteractive(),
        this.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(16, top, WIDTH - 32, HEIGHT - top - 16, 18),
        this.add.image(92, top + 14, bustKey(speaker)).setOrigin(0.5, 1).setDisplaySize(120, 166),
        this.add.text(164, top + 16, `${who.name} · ${who.role}`, { fontFamily: FONT, fontSize: "13px", color: "#586070" }),
        this.add.text(36, top + 44, `«${phrase}»`, { fontFamily: FONT, fontSize: "17px", color: "#15171c", wordWrap: { width: WIDTH - 72 } }),
        ...options.map((option, index) =>
          this.makeButton(WIDTH / 2, top + 130 + index * 70, WIDTH - 64, 58, option.label, 0xf3f4f6, "#15171c", () => {
            close();
            option.onPick();
          }),
        ),
      ]);
    }

    // ---------- ход игры ----------

    private start() {
      this.started = true;
      this.clock = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });
      if (this.plannedEvent === "tea") this.time.delayedCall(P.Math.Between(6000, 11000), () => this.teaRequest());
    }

    private tick() {
      if (this.paused || this.found || this.over) return;
      this.secondsLeft -= 1;
      this.timerText.setText(this.formatTime());
      if (this.secondsLeft <= 10) this.timerText.setColor("#ff6b6b");
      if (this.secondsLeft <= 0) this.finish(judge({ kind: this.kind, found: false, actions: [], wrongTaps: this.wrongTaps, event: this.event }));
    }

    // Посреди осмотра пассажирка просит чай: ответить вежливо и продолжить, отвлечься или промолчать
    private teaRequest() {
      if (this.found || this.over) return;
      this.paused = true;
      this.walk?.stop();
      const resume = (choice: "polite" | "serve" | "ignore") => {
        this.event = { id: "tea", choice };
        if (choice === "serve") {
          this.secondsLeft -= TEA_SECONDS;
          this.timerText.setText(this.formatTime());
          this.hintText.setText(`Сходили за чаем — минус ${TEA_SECONDS} секунд осмотра`);
        }
        this.paused = false;
      };
      this.dialog("tea", "Проводник, принесите, пожалуйста, чай!", [
        { label: "«Минуту, я закончу осмотр салона и подойду к вам»", onPick: () => resume("polite") },
        { label: "Сходить за чаем, осмотр подождёт", onPick: () => resume("serve") },
        { label: "Пройти мимо молча", onPick: () => resume("ignore") },
      ]);
    }

    private walkTo(y: number, then?: () => void) {
      const target = P.Math.Clamp(y, AISLE_TOP, AISLE_BOTTOM);
      this.walk?.stop();
      const distance = Math.abs(target - this.conductor.y);
      if (distance < 2) {
        then?.();
        return;
      }
      this.walk = this.tweens.add({ targets: this.conductor, y: target, duration: distance / WALK_SPEED, ease: "Sine.easeInOut", onComplete: () => then?.() });
    }

    private near(spot: Seat) {
      return Math.abs(this.conductor.y - spot.y) <= REACH_Y;
    }

    private inspectAttended(bag: Seat, owner: Passenger) {
      if (!this.canWalk() || !this.near(bag)) return;
      this.wrongTaps += 1;
      this.say(owner.seat, "Это моя сумка");
      this.hintText.setText("Рядом сидит владелец. Ищите вещь, возле которой никого нет");
    }

    private say(seat: Seat, phrase: string) {
      const bubble = this.add
        .text(seat.x, seat.y - 36, phrase, { fontFamily: FONT, fontSize: "13px", color: "#15171c", backgroundColor: "#ffffff", padding: { x: 8, y: 4 } })
        .setOrigin(0.5);
      this.tweens.add({ targets: bubble, alpha: 0, y: bubble.y - 16, delay: 900, duration: 500, onComplete: () => bubble.destroy() });
    }

    // Нашли: подсказка соседа (если есть), событие «сам вынесу» (если выпало), затем выбор действий
    private inspectItem() {
      if (!this.canWalk() || !this.near(this.item.seat)) return;
      this.found = true;
      const rule = ITEMS[this.kind];
      this.hintText.setText(`${rule.title}. Что делаете?`);
      this.tweens.add({ targets: this.conductor, scale: 1.15, yoyo: true, duration: 180 });
      const steps: (() => void)[] = [];
      if (rule.clue) {
        const clue = rule.clue;
        steps.push(() => this.dialog(clue.speaker, clue.text, [{ label: "Понятно", onPick: next }]));
      }
      if (this.plannedEvent === "grab") steps.push(() => this.grabAttempt());
      steps.push(() => this.showActions());
      let step = 0;
      function next() {
        steps[step++]?.();
      }
      this.time.delayedCall(400, next);
    }

    // Пассажир хочет сам вынести вещь в тамбур: остановить его — или нарушение памятки
    private grabAttempt() {
      this.dialog("grabber", "Да я сам её в тамбур вынесу, чего ждать!", [
        {
          label: "«Пожалуйста, не трогайте вещь — мы уточним, чья она»",
          onPick: () => {
            this.event = { id: "grab", choice: "stop" };
            this.showActions();
          },
        },
        {
          label: "Пусть выносит, раз хочет",
          onPick: () => {
            this.event = { id: "grab", choice: "allow" };
            this.alarm();
            this.finish(judge({ kind: this.kind, found: true, actions: this.actions, wrongTaps: this.wrongTaps, event: this.event }));
          },
        },
      ]);
    }

    // Выбор действий: варианты этой находки в случайном порядке, выбранные нумеруются.
    // Действия меняют вагон: лишняя тревога пугает пассажиров, эвакуация отводит соседние ряды
    private showActions() {
      const rule = ITEMS[this.kind];
      const layer = this.add.container(0, 0);
      layer.add([
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.4).setInteractive(),
        this.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(16, 210, WIDTH - 32, 574, 18),
        this.add.text(36, 230, `${rule.title}. Ваши действия по порядку:`, {
          fontFamily: FONT,
          fontSize: "17px",
          fontStyle: "bold",
          color: "#15171c",
          wordWrap: { width: WIDTH - 72 },
        }),
      ]);
      shuffle(rule.offered).forEach((id, index) => {
        const button = this.makeButton(WIDTH / 2, 316 + index * 92, WIDTH - 64, 80, ACTION_TEXT[id], 0xf3f4f6, "#15171c", () => {
          if (this.over || this.actions.includes(id)) return;
          this.actions.push(id);
          const bad = rule.forbidden.includes(id);
          const excess = id in rule.excess;
          (button.list[0] as Phaser.GameObjects.Rectangle).setFillStyle(bad ? 0xfdeeee : excess ? 0xfdf6e3 : 0xe8f6ee);
          (button.list[1] as Phaser.GameObjects.Text).setText(`${this.actions.length}. ${ACTION_TEXT[id]}`);
          if (bad) this.alarm();
          if (excess) this.panic();
          if (id === "evacuate") this.evacuate();
          if (id === "clear") this.tweens.add({ targets: this.item.body, x: `+=${SEAT_X[0] - AISLE_X + 40}`, alpha: 0.4, duration: 500 });
          if (isFinished(this.kind, this.actions)) {
            this.time.delayedCall(700, () => layer.destroy());
            this.finish(judge({ kind: this.kind, found: true, actions: this.actions, wrongTaps: this.wrongTaps, event: this.event }));
          }
        });
        layer.add(button);
      });
    }

    private alarm() {
      this.cameras.main.shake(300, 0.012);
      this.cameras.main.flash(300, 214, 59, 59);
    }

    // Лишняя тревога: пассажиры в вагоне встревожены
    private panic() {
      for (const passenger of this.passengers) passenger.head.setTexture(headKey(passenger.look, "worried"));
    }

    // Пассажиры двух ближайших рядов пересаживаются подальше от находки
    private evacuate() {
      for (const passenger of this.passengers) {
        if (Math.abs(passenger.seat.y - this.item.seat.y) > ROW_STEP * 2) continue;
        const away = passenger.seat.y < this.item.seat.y ? -1 : 1;
        this.tweens.add({ targets: passenger.parts, y: `+=${away * ROW_STEP * 2}`, alpha: 0.45, duration: 700, ease: "Sine.easeInOut" });
      }
    }

    private finish(result: Result) {
      if (this.over) return;
      this.over = true;
      this.clock?.remove();
      this.walk?.stop();
      this.hintText.setText(result.outcome === "bad" ? "Осмотр провален — разбор ниже" : "Осмотр завершён — разбор ниже");
      this.time.delayedCall(900, () => onFinish(result));
    }
  }

  return new P.Game({
    type: P.AUTO,
    parent,
    backgroundColor: "#f3f4f6",
    scale: { mode: P.Scale.FIT, autoCenter: P.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
    scene: InspectionScene,
  });
}
