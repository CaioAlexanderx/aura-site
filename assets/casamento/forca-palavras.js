/* Forca Combate — banco de palavras. n: 1 fácil, 2 médio, 3 difícil. Sem acentos (o jogo normaliza). */
var PALAVRAS = [
  /* ---------- FÁCIL ---------- */
  { n:1, cat:"Geek", p:"STAR WARS" }, { n:1, cat:"Geek", p:"PIKACHU" }, { n:1, cat:"Geek", p:"HARRY POTTER" }, { n:1, cat:"Geek", p:"BATMAN" },
  { n:1, cat:"Geek", p:"MARIO" }, { n:1, cat:"Geek", p:"HOMEM ARANHA" }, { n:1, cat:"Geek", p:"NARUTO" }, { n:1, cat:"Geek", p:"MINECRAFT" },
  { n:1, cat:"Geek", p:"STRANGER THINGS" }, { n:1, cat:"Geek", p:"DRAGON BALL" }, { n:1, cat:"Geek", p:"PLAYSTATION" }, { n:1, cat:"Geek", p:"SONIC" },
  { n:1, cat:"Conhecimentos gerais", p:"AMAZONIA" }, { n:1, cat:"Conhecimentos gerais", p:"PIRAMIDE" }, { n:1, cat:"Conhecimentos gerais", p:"OXIGENIO" },
  { n:1, cat:"Conhecimentos gerais", p:"MONALISA" }, { n:1, cat:"Conhecimentos gerais", p:"ELEFANTE" }, { n:1, cat:"Conhecimentos gerais", p:"CHOCOLATE" },
  { n:1, cat:"Conhecimentos gerais", p:"VULCAO" }, { n:1, cat:"Conhecimentos gerais", p:"GIRASSOL" }, { n:1, cat:"Conhecimentos gerais", p:"DINOSSAURO" },
  { n:1, cat:"Historia do Brasil", p:"PEDRO ALVARES CABRAL" }, { n:1, cat:"Historia do Brasil", p:"TIRADENTES" }, { n:1, cat:"Historia do Brasil", p:"DOM PEDRO" },
  { n:1, cat:"Historia do Brasil", p:"BRASILIA" }, { n:1, cat:"Historia do Brasil", p:"PRINCESA ISABEL" }, { n:1, cat:"Historia do Brasil", p:"SANTOS DUMONT" },
  { n:1, cat:"Historia do Brasil", p:"CARNAVAL" }, { n:1, cat:"Historia do Brasil", p:"PELE" },
  { n:1, cat:"Mundo", p:"TORRE EIFFEL" }, { n:1, cat:"Mundo", p:"PANDEMIA" }, { n:1, cat:"Mundo", p:"COPA DO MUNDO" }, { n:1, cat:"Mundo", p:"OLIMPIADAS" },
  { n:1, cat:"Mundo", p:"MURALHA DA CHINA" }, { n:1, cat:"Mundo", p:"TITANIC" }, { n:1, cat:"Mundo", p:"INTERNET" }, { n:1, cat:"Mundo", p:"HALLOWEEN" },
  { n:1, cat:"Casamento", p:"ALIANCA" }, { n:1, cat:"Casamento", p:"LUA DE MEL" }, { n:1, cat:"Casamento", p:"BUQUE" }, { n:1, cat:"Casamento", p:"HANDFASTING" },

  /* ---------- MÉDIO ---------- */
  { n:2, cat:"Geek", p:"MILLENNIUM FALCON" }, { n:2, cat:"Geek", p:"HOGWARTS" }, { n:2, cat:"Geek", p:"WAKANDA" }, { n:2, cat:"Geek", p:"THE LAST OF US" },
  { n:2, cat:"Geek", p:"CAVALEIROS DO ZODIACO" }, { n:2, cat:"Geek", p:"VALFENDA" }, { n:2, cat:"Geek", p:"BLACK MIRROR" }, { n:2, cat:"Geek", p:"MORTAL KOMBAT" },
  { n:2, cat:"Geek", p:"GAME OF THRONES" }, { n:2, cat:"Geek", p:"DUNGEONS AND DRAGONS" }, { n:2, cat:"Geek", p:"EVANGELION" }, { n:2, cat:"Geek", p:"ZELDA" },
  { n:2, cat:"Conhecimentos gerais", p:"FOTOSSINTESE" }, { n:2, cat:"Conhecimentos gerais", p:"MERIDIANO" }, { n:2, cat:"Conhecimentos gerais", p:"CORDILHEIRA DOS ANDES" },
  { n:2, cat:"Conhecimentos gerais", p:"LEONARDO DA VINCI" }, { n:2, cat:"Conhecimentos gerais", p:"MITOCONDRIA" }, { n:2, cat:"Conhecimentos gerais", p:"EQUINOCIO" },
  { n:2, cat:"Conhecimentos gerais", p:"ORNITORRINCO" }, { n:2, cat:"Conhecimentos gerais", p:"GUTENBERG" }, { n:2, cat:"Conhecimentos gerais", p:"ESCALA RICHTER" },
  { n:2, cat:"Historia do Brasil", p:"INCONFIDENCIA MINEIRA" }, { n:2, cat:"Historia do Brasil", p:"LEI AUREA" }, { n:2, cat:"Historia do Brasil", p:"GETULIO VARGAS" },
  { n:2, cat:"Historia do Brasil", p:"DIRETAS JA" }, { n:2, cat:"Historia do Brasil", p:"PLANO REAL" }, { n:2, cat:"Historia do Brasil", p:"ZUMBI DOS PALMARES" },
  { n:2, cat:"Historia do Brasil", p:"SEMANA DE ARTE MODERNA" }, { n:2, cat:"Historia do Brasil", p:"GUERRA DO PARAGUAI" }, { n:2, cat:"Historia do Brasil", p:"JUSCELINO KUBITSCHEK" },
  { n:2, cat:"Mundo", p:"QUEDA DO MURO DE BERLIM" }, { n:2, cat:"Mundo", p:"BREXIT" }, { n:2, cat:"Mundo", p:"NELSON MANDELA" }, { n:2, cat:"Mundo", p:"CHERNOBYL" },
  { n:2, cat:"Mundo", p:"REVOLUCAO FRANCESA" }, { n:2, cat:"Mundo", p:"GUERRA FRIA" }, { n:2, cat:"Mundo", p:"INTELIGENCIA ARTIFICIAL" }, { n:2, cat:"Mundo", p:"APOLLO ONZE" },
  { n:2, cat:"Mundo", p:"MALALA" }, { n:2, cat:"Mundo", p:"ONZE DE SETEMBRO" },
  { n:2, cat:"Casamento", p:"ATE QUE A MORTE NOS SEPARE" }, { n:2, cat:"Casamento", p:"BODAS DE PRATA" }, { n:2, cat:"Casamento", p:"MARCHA NUPCIAL" },

  /* ---------- DIFÍCIL ---------- */
  { n:3, cat:"Geek", p:"KESSEL EM DOZE PARSECS" }, { n:3, cat:"Geek", p:"EXPELLIARMUS" }, { n:3, cat:"Geek", p:"NEUROMANCER" }, { n:3, cat:"Geek", p:"SHODAN" },
  { n:3, cat:"Geek", p:"HIDEO KOJIMA" }, { n:3, cat:"Geek", p:"CTHULHU" }, { n:3, cat:"Geek", p:"BLADE RUNNER" }, { n:3, cat:"Geek", p:"MITHRIL" },
  { n:3, cat:"Geek", p:"SEPHIROTH" }, { n:3, cat:"Geek", p:"CHRONO TRIGGER" }, { n:3, cat:"Geek", p:"KAMEHAMEHA" }, { n:3, cat:"Geek", p:"OPETH" },
  { n:3, cat:"Conhecimentos gerais", p:"ENTROPIA" }, { n:3, cat:"Conhecimentos gerais", p:"PARALELEPIPEDO" }, { n:3, cat:"Conhecimentos gerais", p:"OTORRINOLARINGOLOGISTA" },
  { n:3, cat:"Conhecimentos gerais", p:"BOSON DE HIGGS" }, { n:3, cat:"Conhecimentos gerais", p:"QUILOMBO" }, { n:3, cat:"Conhecimentos gerais", p:"ESTALACTITE" },
  { n:3, cat:"Conhecimentos gerais", p:"CRIPTOGRAFIA" }, { n:3, cat:"Conhecimentos gerais", p:"HIPOCAMPO" }, { n:3, cat:"Conhecimentos gerais", p:"PERMAFROST" },
  { n:3, cat:"Historia do Brasil", p:"REVOLTA DA VACINA" }, { n:3, cat:"Historia do Brasil", p:"CONFEDERACAO DO EQUADOR" }, { n:3, cat:"Historia do Brasil", p:"GUERRA DE CANUDOS" },
  { n:3, cat:"Historia do Brasil", p:"CABANAGEM" }, { n:3, cat:"Historia do Brasil", p:"BALAIADA" }, { n:3, cat:"Historia do Brasil", p:"MARECHAL DEODORO" },
  { n:3, cat:"Historia do Brasil", p:"TRATADO DE TORDESILHAS" }, { n:3, cat:"Historia do Brasil", p:"MISSAO ARTISTICA FRANCESA" }, { n:3, cat:"Historia do Brasil", p:"NOITE DAS GARRAFADAS" },
  { n:3, cat:"Mundo", p:"TRATADO DE VERSALHES" }, { n:3, cat:"Mundo", p:"PRIMAVERA ARABE" }, { n:3, cat:"Mundo", p:"ACORDO DE PARIS" }, { n:3, cat:"Mundo", p:"GLASNOST" },
  { n:3, cat:"Mundo", p:"CRISE DOS MISSEIS" }, { n:3, cat:"Mundo", p:"PERESTROIKA" }, { n:3, cat:"Mundo", p:"ROSETTA" }, { n:3, cat:"Mundo", p:"ANTROPOCENO" },
  { n:3, cat:"Mundo", p:"MAGNA CARTA" }, { n:3, cat:"Mundo", p:"SILICON VALLEY" },
  { n:3, cat:"Casamento", p:"HIPOTENUSA DO AMOR" }, { n:3, cat:"Casamento", p:"QUEENS OF THE STONE AGE" }, { n:3, cat:"Casamento", p:"IN MY TIME OF NEED" }
];
