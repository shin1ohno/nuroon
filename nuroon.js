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
                subscription.heartbeat(device);
            });

            device.on("press", () => {
                subscription.press();
            });

            device.on("swipe", (direction) => {
                subscription.swipe(direction);
            });

            device.on("touch", (direction) => {
                subscription.touch(direction);
            });

            device.on("rotate", (amount) => {
                subscription.rotate(amount);
            });

            device.on("fly", (direction, speed) => {
                //The speed parameter is always zero so just ignore
                subscription.fly(direction);
            });

            device.on("distance", (distance) => {
                subscription.detect(distance);
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
