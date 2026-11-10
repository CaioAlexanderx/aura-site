// Telefone do cadastro (/comecar) com +55 (10/11/2026). Sem dependência.
//   node scripts/tests/telefone-comecar.test.js
//
// Dois cadastros saíram com o WhatsApp cortado ("55669923845", "55389994850"):
// a máscara de js/comecar.js fazia slice(0, 11) antes de tirar o 55 do país,
// e o maxlength="16" cortava o que era colado com espaços.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const P = require(path.join(ROOT, 'js', 'phone-br.js'));

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message); }
}

teste('+55 colado, digitado ou com espaços: o celular inteiro, sem o 55', () => {
  assert.equal(P.format('+55 (66) 99238-4539'), '(66) 99238-4539');
  assert.equal(P.format('5566992384539'), '(66) 99238-4539');
  assert.equal(P.format('  +55  66  99238  4539 '), '(66) 99238-4539');
  assert.equal(P.format('66992384539'), '(66) 99238-4539');
  assert.equal(P.normalize('+55 (38) 99948-5059'), '38999485059');
});

teste('digitando o +55 tecla a tecla, nada se perde no fim', () => {
  let v = '';
  for (const tecla of '5566992384539') v = P.format(v + tecla);
  assert.equal(v, '(66) 99238-4539');
});

teste('dígito a mais: nada cortado e a mensagem gentil', () => {
  assert.equal(P.format('669923845391'), '669923845391');
  assert.equal(P.isTooLong('669923845391'), true);
  assert.equal(P.isTooLong('5566992384539'), false);
  assert.match(P.TOO_LONG_MSG, /dígitos a mais/);
  assert.equal(P.isValid('669923845391'), false);
});

teste('DDD 55 (RS) com 11 dígitos continua intacto', () => {
  assert.equal(P.format('55987654321'), '(55) 98765-4321');
});

teste('/comecar: maxlength cabe o colar e phone-br.js carrega antes do comecar.js', () => {
  const html = read('comecar.html');
  const input = html.match(/<input name="phone"[^>]*>/);
  assert.ok(input, 'campo phone existe');
  const max = Number((input[0].match(/maxlength="(\d+)"/) || [])[1]);
  assert.ok(max >= '+55 (66) 99238-4539'.length, 'maxlength ' + max + ' corta o colar');
  const iPhone = html.indexOf('<script src="/js/phone-br.js"></script>');
  const iComecar = html.indexOf('<script src="/js/comecar.js"></script>');
  assert.ok(iPhone >= 0 && iComecar > iPhone, 'phone-br.js antes de comecar.js');
});

teste('js/comecar.js: sem slice(0, 11) no telefone e com o aviso de dígito a mais', () => {
  const js = read('js/comecar.js');
  const mask = js.slice(js.indexOf('function maskPhone'), js.indexOf('function maskPhone') + 400);
  assert.doesNotMatch(mask, /slice\(0, 11\)/);
  assert.match(js, /phone\.length > 11\) return showError\("register", PHONE_TOO_LONG\)/);
});

if (falhas) { console.log('\n' + falhas + ' falha(s)'); process.exit(1); }
console.log('\ntudo ok');
