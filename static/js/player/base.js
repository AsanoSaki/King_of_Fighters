import { AcGameObject } from "/static/js/ac_game_object/base.js";

class Player extends AcGameObject {
    constructor(root, info) {
        super();

        this.root = root;
        this.id = info.id;
        this.x = info.x;
        this.y = info.y;
        this.width = info.width;
        this.height = info.height;
        this.color = info.color;  // 先绘制矩形模拟角色，当设置动画后该属性失效

        this.direction = 1;  // 角色的方向，正方向为1，反方向为-1

        this.vx = 0;  // 当前水平速度
        this.vy = 0;  // 当前垂直速度

        this.speedx = 350;  // 水平移动速度
        this.speedy = -1400;  // 跳起的初始速度

        this.gravity = 25;  // 重力

        this.ctx = this.root.game_map.ctx;

        this.pressed_keys = this.root.game_map.controller.pressed_keys;

        this.status = 3;  // 0: idle，1: forward，2: backward，3: jump，4: attack，5: be attacked，6: die
        this.animations = new Map();  // 表示每个状态的动作
        this.frame_current_cnt = 0;  // 表示当前记录了多少帧

        this.hp = 100;
        this.$hp_outer = this.root.$kof.find(`.kof-head>.kof-head-hp-${this.id}>.kof-head-hp-${this.id}-inner>.kof-head-hp-${this.id}-outer`);  // 外层血条
        this.$hp_inner = this.root.$kof.find(`.kof-head>.kof-head-hp-${this.id}>.kof-head-hp-${this.id}-inner`);  // 内层血条
    }

    start() {

    }

    update_move() {
        this.vy += this.gravity;

        this.x += this.vx * this.timedelta / 1000;
        this.y += this.vy * this.timedelta / 1000;

        if (this.y > 450) {  // 落到地上时停止下落
            this.y = 450;
            this.vy = 0;
            if (this.status === 3) this.status = 0;  // 只有之前是跳跃状态才需要从跳跃状态转变为静止状态
        }

        if (this.x < 0) {  // 左右边界判断
            this.x = 0;
        } else if (this.x + this.width > this.root.game_map.$canvas.width()) {
            this.x = this.root.game_map.$canvas.width() - this.width;
        }
    }

    update_control() {
        let w, a, d, j;  // 表示这些键是否按住
        if (this.id === 0) {
            w = this.pressed_keys.has('w');
            a = this.pressed_keys.has('a');
            d = this.pressed_keys.has('d');
            j = this.pressed_keys.has('j');
        } else {
            w = this.pressed_keys.has('ArrowUp');
            a = this.pressed_keys.has('ArrowLeft');
            d = this.pressed_keys.has('ArrowRight');
            j = this.pressed_keys.has('1');
        }

        if (this.status === 0 || this.status === 1) {  /// 假设角色在跳跃状态无法操控
            if (w) {  // 跳跃有向右跳，垂直跳和向左跳
                if (d) {
                    this.vx = this.speedx;
                } else if (a) {
                    this.vx = -this.speedx;
                }
                else {
                    this.vx = 0;
                }
                this.vy = this.speedy;
                this.status = 3;
                this.frame_current_cnt = 0;  // 从第0帧开始渲染
            } else if (j) {
                this.status = 4;
                this.vx = 0;
                this.frame_current_cnt = 0;  // 从第0帧开始渲染
            } else if (d) {
                this.vx = this.speedx;
                this.status = 1;
            } else if (a) {
                this.vx = -this.speedx;
                this.status = 1;
            } else {
                this.vx = 0;
                this.status = 0;
            }
        }
    }

    update_direction() {
        if (this.status === 6) return;  // die后不再改变方向

        let players = this.root.players;
        if (players[0] && players[1]) {
            let me = this, you = players[1 - this.id];
            if (me.x < you.x) me.direction = 1;
            else me.direction = -1;
        }
    }

    is_attacked() {  // 被攻击
        if (this.status === 6) return;  // die后不再被攻击

        this.status = 5;
        this.frame_current_cnt = 0;

        this.hp = Math.max(this.hp - 20, 0);

        // 使用transition控制血条衰减的速度
        this.$hp_outer.css({
            width: this.$hp_inner.parent().width() * this.hp / 100,
        })
        this.$hp_inner.css({
            width: this.$hp_inner.parent().width() * this.hp / 100,
            transition: '1500ms'
        })

        // 使用animate控制血条衰减的速度
        // this.$hp_outer.width(this.$hp_inner.parent().width() * this.hp / 100);
        // this.$hp_inner.animate({
        //     width: this.$hp_inner.parent().width() * this.hp / 100
        // }, 1500);

        this.vx = 100 * (-this.direction);  // 向反方向的击退效果

        if (this.hp === 0) {
            this.status = 6;
            this.frame_current_cnt = 0;
        }
    }

    is_collision(r1, r2) {  // 碰撞检测
        if (Math.max(r1.x1, r2.x1) > Math.min(r1.x2, r2.x2))
            return false;
        if (Math.max(r1.y1, r2.y1) > Math.min(r1.y2, r2.y2))
            return false;
        return true;
    }

    update_attack() {
        if (this.status === 4 && this.frame_current_cnt === 38) {  // 攻击动画到第38帧的时候检测碰撞
            let me = this, you = this.root.players[1 - this.id];

            let r1;
            if (me.direction > 0) {
                r1 = {
                    x1: me.x + 120,  // (x1, y1)为攻击区域的左上角坐标
                    y1: me.y + 40,
                    x2: me.x + 120 + 100,  // (x2, y2)为攻击区域的右下角坐标
                    y2: me.y + 40 + 20
                }
            } else {
                r1 = {
                    x1: this.x + this.width - 220,
                    y1: me.y + 40,
                    x2: this.x + this.width - 220 + 100,
                    y2: me.y + 40 + 20
                }
            }

            let r2 = {
                x1: you.x,
                y1: you.y,
                x2: you.x + you.width,
                y2: you.y + you.height
            }

            if (this.is_collision(r1, r2)) {
                you.is_attacked();
            }
        }
    }

    update() {
        this.update_control();
        this.update_direction();
        this.update_move();
        this.update_attack();

        this.render();
    }

    render() {
        // 测试玩家模型
        // this.ctx.fillStyle = this.color;
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);

        // 测试出拳碰撞模型
        // if (this.direction > 0) {
        //     this.ctx.fillStyle = 'red';
        //     this.ctx.fillRect(this.x + 120, this.y + 40, 100, 20);
        // } else {
        //     this.ctx.fillStyle = 'red';
        //     this.ctx.fillRect(this.x + this.width - 220, this.y + 40, 100, 20);
        // }

        let status = this.status;

        if (this.status === 1 && this.direction * this.vx < 0) {  // 如果角色方向和水平速度方向乘积为负说明是后退
            status = 2;
        }

        let obj = this.animations.get(status);
        if (obj && obj.loaded) {
            if (this.direction > 0) {
                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;  // 循环渲染，且控制其不每帧渲染一次，否则动作速度太快
                let image = obj.gif.frames[k].image;
                this.ctx.drawImage(image, this.x, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);
            } else {  // 当前角色方向为负方向
                this.ctx.save();
                this.ctx.scale(-1, 1);  // x轴坐标乘上-1，y轴坐标不变
                this.ctx.translate(-this.root.game_map.$canvas.width(), 0);

                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;
                let image = obj.gif.frames[k].image;
                this.ctx.drawImage(image, this.root.game_map.$canvas.width() - this.x - this.width, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);

                this.ctx.restore();
            }
        }

        // 跳跃和攻击动画结束后应回到静止状态
        if ((status === 3 || status === 4 || status === 5) && this.frame_current_cnt === obj.frame_rate * (obj.frame_cnt - 1)) {
            this.status = 0;
        }

        // die的最后一帧后应倒地不起
        if (status === 6 && this.frame_current_cnt === obj.frame_rate * (obj.frame_cnt - 1)) {
            this.frame_current_cnt--;  // 和后面的this.frame_current_cnt++抵消
            this.vx = 0;  // die后不再有击退效果
        }

        this.frame_current_cnt++;
    }
}

export {
    Player
}