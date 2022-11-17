import { AcGameObject } from '/static/js/ac_game_object/base.js';
import { Controller } from '/static/js/controller/base.js';

class GameMap extends AcGameObject {
    constructor(root) {
        super();

        this.root = root;
        this.$canvas = $('<canvas width="1280" height="720" tabindex=0></canvas>');
        this.ctx = this.$canvas[0].getContext('2d');
        this.root.$kof.append(this.$canvas);
        this.$canvas.focus();

        this.controller = new Controller(this.$canvas);

        this.root.$kof.append($(`
        <div class="kof-head">
            <div class="kof-head-hp-0">
                <div class="kof-head-hp-0-inner">
                    <div class="kof-head-hp-0-outer"></div>
                </div>
            </div>
            <div class="kof-head-timer">60</div>
            <div class="kof-head-hp-1">
                <div class="kof-head-hp-1-inner">
                    <div class="kof-head-hp-1-outer"></div>
                </div>
            </div>
        </div>
        <audio class="bgm" src="/static/audios/bgm.mp3">
        </audio>`));

        this.time_left = 60000;  // 剩余时间60s
        this.$timer = this.root.$kof.find('.kof-head-timer');
    }

    start() {

    }

    update_hp(player) {
        this.$hp_outer = this.root.$kof.find(`.kof-head>.kof-head-hp-${player.id}>.kof-head-hp-${player.id}-inner>.kof-head-hp-${player.id}-outer`);
        this.$hp_inner = this.root.$kof.find(`.kof-head>.kof-head-hp-${player.id}>.kof-head-hp-${player.id}-inner`);
        this.$hp_outer.css({
            width: this.$hp_inner.parent().width() * player.hp / 100,
        })
        this.$hp_inner.css({
            width: this.$hp_inner.parent().width() * player.hp / 100,
            transition: '1500ms'
        })
    }

    update() {
        let [a, b] = this.root.players;

        if (this.time_left > 0 && a.status !== 6 && b.status !== 6) {  // 没人die时计时
            this.time_left -= this.timedelta;
        } else if (this.time_left < 0 && this.time_left > -500) {  // 时间结束后血少的玩家die，血相同一起die，只执行一次
            this.time_left = -500;

            if (a.hp !== b.hp) {
                let lower = (a.hp > b.hp) ? b : a;
                lower.hp = 0;
                lower.status = 6;
                lower.frame_current_cnt = 0;

                this.update_hp(lower);
            } else {
                a.status = b.status = 6;
                a.hp = b.hp = 0;
                a.frame_current_cnt = b.frame_current_cnt = 0;

                this.update_hp(a);
                this.update_hp(b);
            }
        }

        this.$timer.text(parseInt(this.time_left / 1000));

        this.render();
    }

    render() {  // 渲染函数
        // 每一帧需要清空地图，不然看到的效果就不是物体在移动，而是拖出一条线
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // this.ctx.fillStyle = 'black';
        // this.ctx.fillRect(0, 0, this.$canvas.width(), this.$canvas.height());
    }
}

export {
    GameMap
}