// Autenticação bem simples: uma chave compartilhada (API_KEY) que o site envia
// no cabeçalho X-Api-Key em toda requisição. Não é uma conta por pessoa — quem
// controla o acesso pessoa a pessoa continua sendo o próprio site (login
// institucional + a lista de contas de controle). Esta chave só impede que
// alguém de fora, sem o endereço e sem a chave, escreva na base.
//
// IMPORTANTE: como o site é uma página estática, essa chave fica visível para
// quem abrir o código-fonte da página no navegador. Trate-a como uma senha de
// baixo sigilo (equivalente a "não public but not secret-grade"), nunca como
// proteção contra alguém que já tem acesso legítimo ao site.
function exigirChave(req, res, next) {
  const esperado = process.env.API_KEY;
  if (!esperado) {
    console.error("ERRO: variável de ambiente API_KEY não definida.");
    return res.status(500).json({ erro: "Servidor mal configurado (API_KEY ausente)." });
  }
  const recebido = req.header("X-Api-Key");
  if (recebido !== esperado) {
    return res.status(401).json({ erro: "Chave de API inválida ou ausente." });
  }
  next();
}

module.exports = { exigirChave };
