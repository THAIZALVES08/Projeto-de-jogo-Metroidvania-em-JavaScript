export function makeDrone(k, initialPos){
    return k.make([
        k.pos(initialPos),k.sprite("drone", {anim: "flying"}),
        k.area({shape: new k.Rect(k.vec2(0), 12, 12)}), //Cria uma área de colisão, formato: retangulo, tamanho: 12x12.
        k.anchor("center"), //Define o ponto de referência do objeto no centro.
        k.body({gravityScale: 0}), //Adiciona física/corpo ao objeto. Gravidade não afeta o drone pois ele pode voar.
        k.offScreen({distance: 400}), //Define comportamento fora da tela.
        k.state("patrol-right",[ //Cria uma máquina de estados, estado incial: patro-right.
        "patrol-right",
        "patrol-left",
        "alert",
        "attack", //Estados possiveis.
        "retreat",]),
        k.health(1), // Adiciona vida ao drone (Ele tem apenas 1 vida).
        "drone", {
            speed: 100, // Velocidade do drone durante patrulha.
            pursuitSpeed: 150, // Velocidade em perseguição.
            range: 100, // Distancia que detecta o jogador.
            setBehavior(){ //Cria um método/função chamada setBehavior
                const player = k.get("player", {recursive: true})[0]; //Procura o objeto com tag "player". Procura dentro de subobjetos. "[0]"Pega o primeiro "player" que encnotrar.
                
                this.onStateEnter("patrol-right", async()=>{ //Executa código quando o drone entra no estado:"patrol-right"
                await k.wait(3); // Espera 3 segundos.
                if(this.state === "patrol-right") this.enterState("patrol-left"); //Verifica se ele ainda está nesse estado.
                // Isso evita bugs caso ele tenha mudado para ataque antes dos 3 segundos.
                });

                this.onStateUpdate("patrol-right", ()=> { //Executa continuamente enquanto o drone estiver em "patrol-right"
                if(this.pos.dist(player.pos) < this.range){ //Calcula a distância entre: posição do drone, posição do jogador 
                    this.enterState("alert"); //Muda para estado de alerta.
                    return;
                }
                
                this.flipX = false; // Faz drone olhar para jogador
                this.move(this.speed, 0);  // Move em direção ao jogador
                });
                
                this.onStateEnter("patrol-left", async () => { // Quando o drone entrar no estado "patrol-left"
                    await k.wait(3); // Espera 3 segundos
                    if (this.state === "patrol-left") this.enterState("patrol-right");  // Verifica se o drone ainda está nesse estado e troca para "patrol-right"
                });

                this.onStateUpdate("patrol-left", () => { // Atualiza continuamente enquanto estiver em "patrol-left"
                    if (this.pos.dist(player.pos) < this.range) {  // Verifica se o jogador está dentro do alcance
                        this.enterState("alert");    // Entra no estado de alerta
                        return;
                    }
                    this.flipX = true;   // Faz o sprite olhar para esquerda
                    this.move(-this.speed, 0);  // Move o drone para esquerda
                });

                this.onStateEnter("alert", async ()=> { // Quando drone entrar no estado "alert"
                    await k.wait(1);   // Espera 1 segundo
                    if(this.pos.dist(player.pos)< this.range){ //Verifica se a distância entre o drone e o jogador é menor que o valor de alcance
                        this.enterState("attack"); // entra no estado de ataque.
                        return;
                    }
                    this.enterState("patrol-right") // Volta para o estado de patrulha para direita
                });

                this.onStateUpdate("attack", () => { // Atualiza continuamente enquanto estiver no estado "attack"
                    if(this.pos.dist(player.pos) > this.range) {  // Verifica se o jogador saiu do alcance do drone
                        this.enterState("alert") // Volta para o estado de alerta
                        return;
                    }
                    this.flipX = player.pos.x <= this.pos.x;     // Faz o drone olhar para o lado do jogador
                    this.moveTo(k.vec2(player.pos.x, player.pos.y + 12),   // Move o drone em direção ao jogador
                    this.pursuitSpeed   // Velocidade de perseguição
                    );
                });
            },

            setEvents(){
                const player = k.get("player", {recursive: true})[0];    // Procura o objeto com tag "player". [0] pega o primeiro player encontrado
                
                this.onCollide("player", ()=>{   // Evento executado quando o drone colidir com o player
                if(player.isAttacking) return;   // Se o player estiver atacando, cancela o restante da função
                this.hurt(1);         // Drone perde 1 de vida
                player.hurt(1);      // Player perde 1 de vida
                });

                this.onAnimEnd((anim)=>{    // Evento executado quando uma animação terminar
                if(anim === "explode") {  // Verifica se a animação terminada foi "explode"
                    k.destroy(this);    // Remove o drone do jogo
                }
                });

                this.on("explode", ()=>{ // Cria um evento chamado "explode"
                k.play("boom"); // Toca o som da explosão
                this.collisionIgnore = ["player"];    // Faz o drone ignorar colisão com o player
                this.unuse("body"); // Remove o componente de física/corpo do drone
                this.play("explode");   // Toca a animação de explosão
                });

                this.onCollide("sword-hitbox", () => { // Evento executado quando a espada atingir o drone
                this.hurt(1);     // Drone perde 1 de vida
                });

                this.on("hurt", () => { // Evento executado quando o drone receber dano
                if(this.hp() === 0) {  // Verifica se a vida do drone chegou a 0
                    this.trigger("explode")  // Ativa o evento de explosão
                }
                });

                this.onExitScreen(() => { // Evento executado quando o drone sair da tela
                    if (this.pos.dist(initialPos) > 400) this.pos = initialPos; //Se a distância da posição até a posição inicial for maior que 400, o drone volta para a posição inicial
                });
            },
        },
    ]);
}