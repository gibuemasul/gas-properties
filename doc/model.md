# Propriedades dos Gases - descrição do modelo

Este documento é uma descrição de alto nível do modelo usado nas simulações de propriedades dos gases, gases: introdução e difusão do PhET e é uma tradução do texto disponível em https://github.com/phetsims/gas-properties/blob/master/doc/model.md#gas-properties---model-description

O modelo consiste em um sistema de partículas e um recipiente, envolvidas em colisões de corpo rígido. Todas as grandezas (pressão, temperatura, volume, velocidade, energia cinética) são derivadas do estado do sistema de partículas e do recipiente, usando a Lei do Gás Ideal. O modelo também suporta manter uma quantidade constante enquanto as outras quantidades são variadas.

Esta descrição se refere principalmente às telas _Ideal_, _Explorar_ e _Energia_. A simulação _Difusão_ possui um modelo mais simples que não envolve a Lei do Gás Ideal.


## Unidades, Constantes e Símbolos

Primeiramente, é feita uma descrição das unidades, constantes e símbolos usados ​​neste simulador. Use esta seção como referência.

#### Unidades

O modelo não usa unidades típicas do SI. As unidades foram escolhidas para que estivéssemos trabalhando com valores que possuem um componente inteiro significativo, e não trabalhando com valores muito pequenos. Trabalhar com valores muito pequenos tende a resultar em erros de ponto flutuante. Assim (por exemplo) as dimensões estão em picômetros (pm) em vez de metros (m).

As unidades usadas nesta sim são:
* ângulo: radianos
* distância: pm
* energia cinética: u * pm<sup>2</sup> / ps<sup>2</sup>
* local: (pm, pm)
* massa: u (unidade de massa atômica, 1 u = 1.66E-27 kg)
* pressão: kPa (e atm em vista)
* temperatura: K (e °C em vista)
* tempo: ps
* velocidade: pm / ps
* volume: pm<sup>3</sup>

#### Constantes

* k = constante de Boltzmann = 8.316E3 (pm<sup>2</sup> * u)/(ps<sup>2</sup> * K), 
[clique aqui](https://github.com/phetsims/gas-properties/blob/master/doc/images/boltzmann-conversion.png) 
para cálculo de conversão

#### Símbolos

* KE = Energia Cinética
* m = massa
* N = número de moléculas de gás (também chamadas de partículas)
* P = pressão
* t = tempo
* T = temperatura
* v = velocidade
* |v| = módulo da velocidade (também conhecida como velocidade)
* V = volume do recipiente

## Equações

Esta seção enumera as equações primárias usadas no sim. Use esta seção como referência.

* Lei do Gás Idea: PV = NkT  
* Pressão: P = NkT/V
* Temperatura: T = (PV)/(Nk) = (2/3)KE/k
* Volume: V = NkT/P = width * height * depth
* Energia Cinética: KE = (3/2)kT = (1/2)m|v|<sup>2</sup>
* Velocidade da Partícula: |v| = sqrt( 3kT/m ) = sqrt( 2KE/m )

##  Sistema de partículas

Particles represent gas molecules. They are rigid bodies that have mass,
radius, location, and velocity. Radius and mass may be modified in the
_Diffusion_ screen, and are fixed in the other screens. Location and
velocity are modified indirectly, as a result of heating/cooling,
changing volume, collisions, etc.

As partículas representam moléculas de gás. São consideradas corpos rígidos que possuem massa, raio, localização e velocidade. Raio e massa podem ser modificados na tela _Difusão_ e são fixados nas demais telas. A localização e a velocidade são modificadas indiretamente, como resultado de aquecimento/resfriamento, mudança de volume, colisões, etc.

A coleção de todas as partículas é chamada de sistema de partículas. Possui as seguintes qualidades:

* `N` é o número de partículas no recipiente
* sem cinemática rotacional (as partículas não giram)
* em gravidade (portanto, sem aceleração)

Todas as quantidades (`P`, `T`, `V`, `v`, `KE`)  são derivadas do estado do sistema de partículas e do recipiente.

Há um estoque limitado de partículas (limitado `N`), conforme indicado pelos spinners "Número de partículas" e o medidor na bomba da bicicleta. Quando as partículas escapam do recipiente pela tampa aberta, elas são imediatamente devolvidas ao inventário. Como não há gravidade, as partículas que escapam do recipiente flutuam para cima e são excluídas do sim quando desaparecem de vista.

Quando uma partícula é adicionada ao recipiente:
* O ângulo inicial é escolhido aleatoriamente a partir da faixa de dispersão da bomba de bicicleta, que é `MATH.PI/2`.  
* IA velocidade inicial é baseada em uma quantidade desejada de energia cinética que resultará em uma temperatura desejada. Por padrão, a temperatura atual do contêiner é usada. Se o recipiente estiver vazio (e, portanto, não tiver temperatura), será usado  `300K` . Na tela _Energia_, o usuário pode, opcionalmente, definir essa temperatura. Quando várias partículas são adicionadas ao recipiente simultaneamente, essa temperatura é tratada como uma temperatura média e as velocidades das partículas individuais são baseadas em uma distribuição gaussiana da temperatura média. A temperatura é usada para calcular a energia cinética via `KE = (3/2)Tk`, e a velocidade é então calculada via `|v| = Math.sqrt( 2KE/m )`.

## Recipiente

O recipiente é uma caixa tridimensional. Na tela _Ideal_ e _Explorar_, a largura (e, portanto, o volume `V`) pode ser alterada movendo a parede esquerda do recipiente.

Na tela _Ideal_, a parede esquerda não funciona. Enquanto o recipiente está sendo redimensionado, o sim é pausado. Após completar o redimensionamento, as partículas são redistribuídas no novo volume.

Na tela _Explorar_, a parede esquerda não funciona em partículas. Ele altera a energia cinética das partículas, alterando sua velocidade. Após ocorrer uma colisão com a parede esquerda, o novo componente x da velocidade de uma partícula é `-( particleVelocity.x - leftWallVelocity.x )`.

Ao redimensionar o recipiente na tela _Explorar_, há um limite de velocidade na parede ao diminuí-lo. Esse limite de velocidade evita que a pressão mude muito drasticamente, o que tornaria muito fácil explodir a tampa do recipiente. 


## Detecção e Resposta de Colisão

Este simulador usa um modelo de colisão de corpo rígido perfeitamente elástico (sem perda líquida de energia cinética). A _detecção de colisão_ identifica quando dois objetos em movimento se cruzam. Quando uma colisão é detectada entre dois objetos, uma resposta de colisão determina o _efeito que a colisão_ tem em seu movimento.

A detecção de colisão ocorre apenas dentro do recipiente. Não há detecção de colisão realizada para partículas que escaparam do recipiente através da tampa aberta. A detecção de colisão é a posteriori (detectada após a ocorrência de uma colisão).

A detecção de colisão é otimizada usando uma técnica chamada [particionamento espacial](https://en.wikipedia.org/wiki/Space_partitioning). O espaço de detecção de colisão é particionado em uma grade 2D de células que chamamos de regiões. Em vez de ter que considerar colisões entre todos os objetos no sistema, apenas objetos dentro da mesma região precisam ser considerados. 
Isso reduz muito o número de testes necessários.

Dois tipos de colisões são suportados: partícula-partícula e partícula-recipiente.
 

* As colisões partícula-partícula ocorrem entre duas partículas e usam um modelo de [contato baseado em impulso](https://en.wikipedia.org/wiki/Collision_response#Impulse-based_contact_model). A colisão partícula-partícula é baseada apenas em se elas se cruzam em suas localizações atuais. É possível (e aceitável) que duas partículas passem pelo mesmo ponto no caminho para esses locais e não colidam. Partícula-partícula pode ser desabilitada na tela _Energia_.  
* As colisões partícula-recipiente ocorrem entre uma partícula e uma parede do recipiente e são contadas para exibição pelo Contador de Colisões. Essas colisões ocorrem se uma partícula entrar em contato com uma parede a caminho de sua localização atual.

A tela _Difusão_ adiciona um divisor vertical removível ao recipiente. Quando o divisor está no lugar, a detecção de colisão trata o recipiente como separado em dois, onde o divisor funciona como uma parede do contêiner.


## Pressão

Quando partículas são adicionadas a um recipiente vazio, a pressão permanece zero até que uma partícula tenha colidido com o recipiente. Então todas as `N` partículas contribuem para a pressão `P` via `P = NkT/V`.

Em cada passo de tempo, a pressão é calculada precisamente como `P = NkT/V`. O medidor de pressão recebe um pouco de "ruído" para torná-lo mais realista. O ruído é uma função da pressão e da temperatura. Mais ruído é adicionado a pressões mais baixas, mas o ruído é suprimido à medida que a temperatura diminui. O ruído é desativado quando a pressão é mantida constante. Consulte [PressureGauge](https://github.com/phetsims/gas-properties/blob/master/js/common/model/PressureGauge.js) se desejar mais detalhes. Se desejado, o ruído pode ser desabilitado através do parâmetro de consulta  `pressureNoise=false`.


## Manter constante

Na tela _Ideal_, o usuário pode especificar qual quantidade em `PV = NkT` deve ser mantida constante. A tabela abaixo resume o comportamento.  

| Manter constante | mudar N | mudar T  | mudar V |
| --- | --- | --- | --- |
| Nada | P changes | P changes | P changes |
| Volume (V) | P changes | P changes | - |
| Temperatura (T) | P changes | - | P changes |
| Pressão↕V | V changes | V changes | - |
| Pressão ↕T | T changes | - | T changes |

A tela _Ideal_ tem uma configuração padrão de "Nada". A tela _Explorar_ tem uma configuração fixa de "Nada". A tela _Energia_ tem uma configuração fixa de "Volume". (Esse recurso é irrelevante na tela _Difusão_.)

Se uma mudança resultar em uma situação sem sentido (por exemplo, manter a temperatura constante sem partículas) ou violar as restrições da simulação (por exemplo, requer um volume de contêiner maior do que o suportado), o sim alterna automaticamente para "Nada" e notifica o usuário através do diálogo.


