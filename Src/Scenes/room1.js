import { makePlayer } from "../Entities/player.js";
import { setBackgrundColor, 
         setMapColliders, 
         setCameraControls, 
         setCameraZones, 
         setExitZones, } from "./roomUtils.js";

export async function room1(k, roomData, previousSceneData = { exitName: null }) {
  setBackgorundColor(k, "#a2aed5");

  k.camScale(4);
  k.camPos(170, 100);
  k.setGravity(1000);

  const roomLayers = roomData.layers;

  const map = k.add([k.pos(), k.sprite("room1")]); //Cria a variável para o mapa da sala 1
  const colliders = []; //Cria a variável para se bater
  const positions = []; //Cria a variável para as posições
  const cameras = []; // Cria a variavel camera que armazena um lista vazia "[]".

  for (const layer of roomLayers) {
    if (layer.name === "positions") {
      positions.push(...layer.objects) //Coloca uma array dentro de outra array ([[1, 2, 3]]) se não tivesse os 3 pontos. Mas como tem ele fica em uma array só ([1, 2, 3])
      continue;
    }
    if (layer.name === "colliders") {
      colliders.push(...layer.objects);
      continue;
    }
  }

  setMapColliders(k, map, colliders);

  const player = map.add(makePlayer(k));

  setCameraControls(k, player, map, roomData);

  for (const position of positions) {
    if (position.name === "player") {
      player.setPosition(position.x, position.y);
      player.setControls();
      player.setEvents();
      player.enablePassthrough();
      player.respawnIfOutOfBounds(1000, "room1");
      continue;
    }
  }
}