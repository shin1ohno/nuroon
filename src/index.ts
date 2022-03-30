import { Bootstrap } from "./app/bootstrap";
import { logger } from "./app/nuRoon";

if (process.argv[2] === "controller") {
  const nuimoId: string = process.argv[3];
  if (nuimoId) {
    Bootstrap.runController(nuimoId);
  } else {
    logger.warn("Please specify the nuimo id to control");
  }
} else {
  Bootstrap.run();
}
