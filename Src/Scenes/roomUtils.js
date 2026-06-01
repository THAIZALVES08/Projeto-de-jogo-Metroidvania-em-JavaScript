import {state} from "../State/globalStateManager.js";
import { statePropsEnum } from "./globalStateManager.js";

export function setBackgrundColor(k, hexColorCode) {
    k.add([
        k.rect(k.width(), k.height()) ,
        k.color(k.Color.fromHex(hexColorCode)),
        k.fixed(),
    ]);
}

export function setMapColliders(k, map, colliders) {
  for (const collider of colliders) {
    if (collider.polygon) {
      const coordinates = [];
      for (const point of collider.polygon) {
        coordinates.push(k.vec2(point.x, point.y));
      }

      map.add([
        k.pos(collider.x, collider.y),
        k.area({
          shape: new k.Polygon(coordinates),
          collisionIgnore: ["collider"]
        }),
        "collider",
        collider.type,
      ]);
      continue;
    }

    if (collider.name === "boss-barrier") {
      const bossBarrier = map.add([
        k.rect(collider.width, collider.height),
        k.color(k.Color.fromHex("#eacfba")),
        k.pos (collider.x, collider.y),
        k.area({
        collisionIgnore: ["collider"],
        }),
        k.opacity(0),
        "boss-barrier",
        {
          activate() {
            k.tween(
            this.opacity,
            0.3,
            1,
            (val) => (this.opacity = val),
            k.easings.linear
            );

            k.tween(
            k.camPos().x,
            collider.properties[0].value,
            1,
            (val) => k.camPos (val, k.camPos().y),
            k.easings.linear
            );
          },

          async deactivate(playerPosX){
            k.tween(
              this.opacity,
              0,
              1,
              (val) => (this.opacity = val),
              k.easings.linear
              );

            await k.tween (
              k.camPos().x,
              playerPosX,
              1,
              (val) => k.camPos(val, k.camPos().y),
              k.easings.linear
              );

            k.destroy(this);
          },
        },
      ]);

      bossBarrier.onCollide("player", async(player)=> {
        const currentState = state.current();
        if(currentState.isBossDefeated){
          state.set(statePropsEnum.playerInBossFight, false);
          bossBarrier.deactivate(player.pos.x);
          return;
        }

        if(currentState.playerInBossFight) return;

        player.disableControls();
        player.play("idle");
        await k.tween(
          player.pos.x,
          player.pos.x + 25,
          0.2,
          (val) => (player.pos.x = val),
          k.easings.linear
        );
        player.setControls();
      });

      bossBarrier.onCollideEnd("player",() => {
        const currentState = state.current()
        if(currentState.playerInBossFight || currentState.isBossDefeated)
          return;

        state.set(statePropsEnum.playerInBossFight, true);

        bossBarrier.activate();
        bossBarrier.use(k.body({isStatic: true}))
      });

      continue;
    }

    map.add([
      k.pos(collider.x, collider.y),
      k.area({
        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
        collisionIgnore: ["collider"],
      }),
      k.body({isStatic: true}), 
      "collider",
      collider.type,
    ]);
  }
}

export function setCameraControls(k, player, map, roomData){ // Controla a camera
  k.onUpdate(() => { // Executa o codigo abaixo toda vez que o jogo atualizar (atualiza cada frame 60 vezes por segundo)
    if(state.current().playerInBossFight) return; // se o jogador estiver em uma bossFight não executa o codigo

    if(map.pos.x + 160 > player.pos.x){ // Da um limite de ate onde a camera segue o jogador.
      k.camPos(map.pos.x + 160, k.camPos().y); // define a posição X e Y da camera. 
      return;
    }

    if(player.pos.x > map.pos.x + roomData.width * roomData.titleWidth - 160 ){ // impede a camera de passar do limite do mapa
      k.camPos( // define a nova posição X e Y da camera.
        map.pos.x + roomData.width * roomData.titleWidth - 160, // define o limite maximo da posição X
        k.camPos().y // mantem a posição y da camera.
      );
      return;
    }

    k.camPos(player.pos.x, k.camPos().y); // // move a câmera horizontalmente junto com o jogador mantendo o eixo Y atual.
  });
}
export function setCameraZones(k, map, cameras) {
  for(const camera of cameras ){ // Percorre todos os elementos do array cameras.
    const cameraZone = map.add([ 
      k.area({ //Cria uma área de colisão/interação.
        shape: new k.Rect(k.vec2(0), camera.width, camera.height), //Define o formato da área 
        collisionIgnore: ["collider"], //Faz essa área ignorar colisões com objetos que tenham a tag "collider".
      }),
      k.pos(camera.x, camera.y),
    ]);

    cameraZone.onCollide("player", () => { // Detectar colisão
      if (k.camPos().x !== camera.properties[0].value){ // Verifica se a posição atual da camera é diferente do valor salvo (camera.properties)
        k.tween( // faz uma transição gradual, faz com que a camera deslize em vez de teleportar
          k.camPos().y, // começa da posição Y atual da camera.
          camera.properties[0].value, // vai até o valor definido na propriedade
          0.8, // duração da animação
          (val) => k.camPos(k.camPos().x, val), // atualização da camera
          k.easings.linear // tipo da animação (linear = velocidade constante)
        );
      }
    });
  }
}