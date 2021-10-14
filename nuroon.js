class Nuroon {
    constructor(nuimo) {
        this.nuimo = nuimo;
    }

    subscribe(nuimo, subscription, callback) {
        nuimo.on("discover", (device) => {
            device.on("connect", () => {
                subscription.connect(device);
            });

            device.on("press", () => {
                subscription.press(device);
            });

            device.on("swipe", (direction) => {
                subscription.swipe(device, direction);
            });

            device.on("touch", (direction) => {
                subscription.touch(device, direction);
            });

            device.on("rotate", (amount) => {
                subscription.rotate(device, amount);
            });

            device.on("fly", (direction, speed) => {
                subscription.fly(device, direction, speed);
            });

            device.on("detect", (distance) => {
                subscription.detect(device, distance);
            });

            callback(device);
        });
    }

    bootstrap(subscription) {
        this.subscribe(this.nuimo, subscription, subscription.callback);
        this.nuimo.scan();
        require('pino')().info("Scanning for Nuimo Controllers.");
    }
}

module.exports = Nuroon;
