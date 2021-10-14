const logger = require("pino")();

class Nuroon {
    constructor(nuimo) {
        this.nuimo = nuimo;
    }

    subscribe(nuimo, subscription, callback) {
        nuimo.on("discover", (device) => {
            nuimo.stop();

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

            device.on("distance", (distance) => {
                subscription.detect(device, distance);
            });

            device.on("disconnect", () => {
                logger.info("Disconnected. Scanning for Nuimo Controllers again.");
                nuimo.scan();
            });

            callback(device);
        });

    }

    bootstrap(subscription) {
        this.subscribe(this.nuimo, subscription, subscription.callback);
        this.nuimo.scan();
        logger.info("Scanning for Nuimo Controllers.");
    }
}

module.exports = Nuroon;
