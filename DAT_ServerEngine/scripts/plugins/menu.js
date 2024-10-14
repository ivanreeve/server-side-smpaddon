import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { shopData } from "./data/shopData.js";
 
function toMoney(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
 
function createShop(formObject) {
  const form = new ActionFormData().title(`§l${formObject.title}`);
  switch (formObject.type) {
    case "navigation":
      formObject.contents.forEach(e => form.button(`§l${e.name}§r§7\n${e.tagline}`,e.icon));
      break;
    case "list":
      formObject.contents.forEach(e => form.button(`§l${e.name}§r§7\nCOST: §a$${toMoney(e.price)}`,e.icon));
  }
  return form;
}
 
const MAX_BALANCE = 999999999;
const MAX_BULK = 1000;
const sellOptions = {
	data: [
		{
			name: "Diamond",
			id: "diamond",
			rate: 1000
		},
		{
			name: "Nautilus Shell",
			id: "nautilus_shell",
			rate: 500
		},
		{
			name: "Gold",
			id: "gold_ingot",
			rate: 200
		},
		{
			name: "Iron",
			id: "iron_ingot",
			rate: 100
		},
		{
			name: "Emerald",
			id: "emerald",
			rate: 50
		},
		{
			name: "Copper",
			id: "copper_ingot",
			rate: 50
		},
		{
			name: "Redstone Dust",
			id: "redstone",
			rate: 25
		},
		{
			name: "Obsidian",
			id: "obsidian",
			rate: 25
		},
		{
			name: "Blue Ice",
			id: "blue_ice",
			rate: 25
		},
		{
			name: "Coal",
			id: "coal",
			rate: 25
		},
		{
			name: "Amethyst Shard",
			id: "amethyst_shard",
			rate: 15
		},
		{
			name: "Clay",
			id: "clay",
			rate: 15
		},
		{
			name: "Charcoal",
			id: "charcoal",
			rate: 15
		},
		{
			name: "Dried Kelp",
			id: "dried_kelp",
			rate: 10
		}
	],
	labels: () => sellOptions.data.map(obj => `${obj.name} for $${obj.rate}`)
};

function purchase(player,shop){
  createShop(shop).show(player).then(content => {
  	if (content.canceled) return;
  	
  	let qty = 1;
	  const item = shop.contents[content.selection];
	  const balance = player.getProperty("bank:balance");
	
	  switch(shop.shopType){
	    case "single": {
	    	if (item.price > balance){ player.sendMessage("§cYou have insufficient balance to purchase this item."); return; }
	    	player.runCommandAsync(`give @s ${item.id}`);
				player.setProperty("bank:balance",balance - item.price);
				player.sendMessage(`§aYou just bought: ${item.name}`);
				break;
	    }
	    case "bulk": {
	    	const buyForm = new ModalFormData()
					.title(`${item.name} - §a$${toMoney(item.price)}`)
					.textField(`You are about to purchase: §b${item.name}§r\n\nPlease enter the amount of items you would like to buy:`,"Amount","1");
				buyForm.show(player).then(buy => {
					if (buy.canceled || !(buy.formValues[0] > 0)) return;
					
					qty = buy.formValues[0];
					const totalCost = qty * item.price;
		 
					if (qty > MAX_BULK){ player.sendMessage(`§cToo many items! The maximum amount you can buy at a time is ${MAX_BULK}.`); return; }
					if (totalCost > balance){ player.sendMessage(`§cYou have insufficient balance to purchase this item x${qty}.`); return; }
		
					player.runCommandAsync(`give @s ${item.id} ${qty}`);
					player.setProperty("bank:balance",balance - totalCost);
					player.sendMessage(`§aYou just bought: x${qty} ${item.name}`);
				});
				break;
	    }
	    case "aircraft": {
	    	if (item.price > balance){ player.sendMessage("§cYou have insufficient balance to purchase this item."); return; }
	    	const buyForm = new ModalFormData()
					.title(`${item.name} - §a$${toMoney(item.price)}`)
					.dropdown(`You are about to purchase: §b${item.name}§r\n\nPlease select a color:`,item.colors);
				buyForm.show(player).then(buy => {
					if (buy.canceled) return;
					
					const selectedColor = item.colors[buy.formValues[0]];
		
					player.runCommandAsync(`summon server:${item.id} ~~~ 0 0 color:${selectedColor.toLowerCase()}`);
					player.setProperty("bank:balance",balance - item.price);
					player.sendMessage(`§aYou just bought: ${selectedColor.toUpperCase()} ${item.name}`);
				});
				break;
	    }
	    case "entity": {
	    	if (item.price > balance){ player.sendMessage("§cYou have insufficient balance to purchase this item."); return; }
	    	player.runCommandAsync(`summon ${item.id}`);
				player.setProperty("bank:balance",balance - item.price);
				player.sendMessage(`§aYou just bought: ${item.name}`);
	    	break;
	    }
	    case "enchantedBook": {
	    	if (item.price > balance){ player.sendMessage("§cYou have insufficient balance to purchase this item."); return; }
	    	if (player.getComponent("inventory").container.emptySlotsCount === 0) player.runCommandAsync(`loot spawn ~~~ loot \"enchanted_books/${item.enchantment}\"`);
	    	else player.runCommandAsync(`loot give @s loot \"enchanted_books/${item.enchantment}\"`);
				player.setProperty("bank:balance",balance - item.price);
				player.sendMessage(`§aYou just bought: ${item.name}`);
	    }
	  }
  });
}
 
const menuStates = {
	home: new ActionFormData().title("§l§bServer Menu")
	  .body("What would you like to do?")
	  .button("§e§lSHOP§r§7\nBuy Items","textures/icons/menu/shop.png")
	  .button("§lGAMES§r§7\nPlay and Win Prizes","textures/icons/menu/games.png")
	  .button(`§lBANK§r§7\nManage Digital Assets`,"textures/icons/menu/bank.png")
	  .button(`§lWARP§r§7\nTeleport to Player`,"textures/icons/menu/warp.png")
	  .button(`§lSHELL§r§7\nCommand Line Interface`,"textures/icons/menu/shell.png"),
	shop(player){
		createShop(shopData.home).show(player).then(category => {
			if (category.canceled) return;
			switch(category.selection){
				case 0: purchase(player,shopData.crops);         break;
	      case 1: purchase(player,shopData.dyes);          break;
	      case 2: purchase(player,shopData.items);         break;
	      case 3: purchase(player,shopData.animals);       break;
	      case 4: purchase(player,shopData.pets);          break;
	      case 5: purchase(player,shopData.aircraft);      break;
	      case 6: purchase(player,shopData.armorTrims);    break;
	      case 8: purchase(player,shopData.specials);      break;
				case 7: {
					createShop(shopData.enchantedBooks.home).show(player).then(type => {
						if (type.canceled) return;
						switch(type.selection){
	            case 0: purchase(player,shopData.enchantedBooks.general);   break;
	            case 1: purchase(player,shopData.enchantedBooks.armor);     break;
	            case 2: purchase(player,shopData.enchantedBooks.melee);     break;
	            case 3: purchase(player,shopData.enchantedBooks.ranged);    break;
	            case 4: purchase(player,shopData.enchantedBooks.tools);
	        	}
					});
				}
			}
		});
	},
	games(player) {
    const homeForm = new ActionFormData().title(`§lGames`)
      .button(`§lLUCKY DRAW§r§7\nTest your luck today!`,"textures/icons/menu/games/lucky_draw.png");
    homeForm.show(player).then(game => {
    	if (game.canceled) return;
    	switch(game.selection){
    		case 0: {
    			const drawPrice = 100;
    			const balance = player.getProperty("bank:balance");
    			const drawForm = new ActionFormData().title(`§lLucky Draw`)
    				.body("Lucky draw is a game that gives you a chance to win items.\n\n§bPrizes are calculated with weighted random chance, so more draws means increasing your chances of winning significantly!\n\n")
    				.button(`§l§eDRAW§r§7\nEach draw costs $${drawPrice}`);
    			drawForm.show(player).then(draw => {
    				if (draw.canceled) return;
    				if (drawPrice > balance){ player.sendMessage("§cYou have insufficient balance to draw."); return; }
    				if (player.getComponent("inventory").container.emptySlotsCount === 0) player.runCommandAsync(`loot spawn ~~~ loot \"lucky_draw/prizepool\"`);
			    	else player.runCommandAsync(`loot give @s loot \"lucky_draw/prizepool\"`);
						player.setProperty("bank:balance",balance - drawPrice);
						player.sendMessage(`§aDraw Successful!`);
    			});
    		}
    	}
    });
	},
	bank(player){
		const bankForm = new ActionFormData().title("§lBank")
			.body(`§bBank Account Information§r\n\nOwner: §a${player.name}§r\nBalance: §e$${toMoney(player.getProperty("bank:balance"))}§r\n\nSelect Transaction Method`)
			.button("§lSELL§r\n§7Exchange Items for Money","textures/icons/menu/bank/sell.png")
			.button("§lTRANSFER§r\n§7Send Money to other Players","textures/icons/menu/bank/transfer.png");
		bankForm.show(player).then(transaction => {
			if (transaction.canceled) return;
			switch(transaction.selection){
				case 0: {
					const sellForm = new ModalFormData().title(`§lSell`)
						.dropdown(`Exchange some of your resources for digital money.\n\nThe digital money can then be used to purchase items in the shop.\n\nSelect item to sell`,sellOptions.labels())
						.textField(`How many?`,`Quantity`);
					sellForm.show(player).then(sell => {
						if (sell.canceled || !(sell.formValues[1] > 0)) return;
						
						const [num,qty] = sell.formValues;
						const eq = sellOptions.data[num].rate * qty;
						const newBalance = player.getProperty("bank:balance") + eq;
						
						if (newBalance > MAX_BALANCE){
							player.sendMessage("§cYour sell amount exceeds the maximum account balance.");
							return;
						}
						
						const success = player.runCommand(`clear @s[hasitem={item=${sellOptions.data[num].id},quantity=${qty}..}] ${sellOptions.data[num].id} 0 ${qty}`).successCount;
						
						if (success === 1){
							player.setProperty("bank:balance",newBalance);
							player.sendMessage(`§aSuccessfully stored $${toMoney(eq)} into your bank account. Your new balance is $${toMoney(newBalance)}.`);
						}
						else player.sendMessage(`§cTransaction failed. Please make sure you have enough items to exchange.`);
						return;
					});
					break;
				}
				case 1: {
					const players = world.getAllPlayers();
					const playerNames = players.map(obj => obj.name);
					const sendMoneyForm = new ModalFormData()
						.title(`§lTransfer`)
						.dropdown(`Send money to other players.\n\nSelect a player`, playerNames)
						.textField(``,`Amount`);
					sendMoneyForm.show(player).then(sendMoney => {
						if (sendMoney.canceled || !(sendMoney.formValues[1] > 0)) return;
						const [targetId, amount] = sendMoney.formValues;
						const targetPlayer = players[targetId];
						const newBalance = {
							target: targetPlayer.getProperty("bank:balance") + amount,
							self: player.getProperty("bank:balance") - amount
						};
						
						if (targetPlayer.name === player.name){
							player.sendMessage(`§cYou cannot send money to yourself.`);
							return;
						}
						if (newBalance.self < 0){
							player.sendMessage(`§cYou cannot send amount larger than your account balance.`);
							return;
						}
						if (newBalance.target > MAX_BALANCE){
							player.sendMessage(`§cThe amount you are trying to send exceeds ${targetPlayer.name}'s maximum account balance.`);
							return;
						}
						
						player.setProperty("bank:balance",newBalance.self);
						targetPlayer.setProperty("bank:balance",newBalance.target);
						targetPlayer.sendMessage(`§a${player.name} has sent you $${toMoney(amount)}.`);
						player.sendMessage(`§aSuccessfully sent $${toMoney(amount)} to ${targetPlayer.name}. Your new balance is $${newBalance.self}.`);
					});
	  		}
			}
		});
	},
	warp(player){
		const players = world.getAllPlayers();
		const playerNames = players.map(obj => obj.name);
		const warpForm = new ModalFormData()
			.title(`§lWarp`)
			.dropdown(`Send a §ateleport request§r to a player. The target player must §aaccept§r the request.\n\nSelect a player`,playerNames)
			.toggle(`Ignore Requests`, player.hasTag("ignoreRequest"));
		warpForm.show(player).then(request => {
			if (request.canceled) return;
			
			const [targetId, shouldIgnore] = request.formValues;
			const targetPlayer = players[targetId];
			
			if (shouldIgnore && !player.hasTag("ignoreRequest")) player.addTag("ignoreRequest");
			if (!shouldIgnore && player.hasTag("ignoreRequest")) player.removeTag("ignoreRequest");
			if (!targetPlayer.hasTag("ignoreRequest")){
				if (targetPlayer.name === player.name){ player.sendMessage(`§cYou cannot teleport to yourself.`); return; }
				const confirm = new ActionFormData()
			    .title(`§lTeleport Request`)
			    .body(`§b${player.name}§r wants to teleport to your location.\n\n§eNote:§r You can choose to ignore teleport requests by disabling the toggle in the warp panel\n\n\n`)
			    .button(`§2ACCEPT`)
			    .button(`§4REJECT`);
				confirm.show(targetPlayer).then(target => {
					switch(target.selection) {
						case 0: player.teleport(targetPlayer.location); break;
						case 1: player.sendMessage(`§c${targetPlayer.name} has declined your request.`);
					}
				});
			}
		});
	},
	shell(player){
		const sh = new ModalFormData()
			.title(`§lShell`)
			.textField(`Provide your command in the text field`,`Your command here`);
		sh.show(player).then(input => {
			if (input.canceled) return;
			const command = input.formValues[0];
			switch(command){
			  case "breakbedrock": {
			    player.runCommandAsync(`fill ~~2~ ~~2~ air replace bedrock`);
			    break;
			  }
			  default: player.sendMessage("§cInvalid command.");
			}
		});
	}
};
 
export function menu(player){
	menuStates.home.show(player).then(menu => {
		if (menu.canceled) return;
		switch(menu.selection){
			case 0: menuStates.shop(player); break;
			case 1: menuStates.games(player); break;
			case 2: menuStates.bank(player); break;
			case 3: menuStates.warp(player); break;
			case 4: menuStates.shell(player);
		}
	});
}