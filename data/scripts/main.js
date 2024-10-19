import { world, system } from "@minecraft/server";
import { menu } from "./plugins/menu.js";

world.beforeEvents.itemUse.subscribe(event => {
  if (event.itemStack.typeId === "server:menu") {
    system.run( () => {
    	menu(event.source);
    });
  }
});