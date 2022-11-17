class Controller {  // 用于读取键盘输入
    constructor($canvas) {
        this.$canvas = $canvas;

        this.pressed_keys = new Set();
        this.start();
    }

    start() {
        let outer = this;
        this.$canvas.on('keydown', function (e) {
            outer.pressed_keys.add(e.key);
        });

        this.$canvas.on('keyup', function (e) {
            outer.pressed_keys.delete(e.key);
        });
    }
}

export {
    Controller
}