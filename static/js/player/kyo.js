import { Player } from '/static/js/player/base.js';
import { GIF } from '/static/js/utils/gif.js';

class Kyo extends Player {
    constructor(root, info) {
        super(root, info);

        this.init_animations();
    }

    init_animations() {
        let outer = this;
        let offsets = [0, -22, -22, -100, 0, 0, 0];
        for (let i = 0; i < 7; i++) {  // 一共7个动画
            let gif = GIF();
            gif.load(`/static/images/player/kyo/${i}.gif`);
            this.animations.set(i, {
                gif: gif,
                frame_cnt: 0,  // 表示gif中的总图片数
                frame_rate: 12,  // 表示每12帧渲染一次
                offset_y: offsets[i],  // y方向的偏移量
                loaded: false,  // 表示是否加载完成
                scale: 2  // 角色放大倍数
            });

            if (i === 3) this.animations.get(i).frame_rate = 10;  // 将跳跃动画渲染速度加快一点

            gif.onload = function () {
                let obj = outer.animations.get(i);
                obj.frame_cnt = gif.frames.length;
                obj.loaded = true;
            }
        }
    }
}

export {
    Kyo
}