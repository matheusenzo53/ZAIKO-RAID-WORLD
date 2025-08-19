// Importa o módulo HTTP, que é necessário para criar o servidor web.
// Importa as bibliotecas padrão do seu bot.
const http = require('http');
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  // Adiciona Intents adicionais para garantir que o bot tenha todas as permissões necessárias.
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    // Intents adicionais do seu código, se houver
  ],
});

// IDs fixos do seu código original
const canalId = "1407072932408328202";          // canal dos avisos
const cargoRaidId = "1407313985576898571";      // 🌍| Raid World

// marcadores pra não duplicar envio no mesmo minuto/hora
let ultimoAviso55 = null; // ex: "2025-08-19 13"
let ultimoAviso00 = null;

client.once("ready", async () => {
  console.log(`🤖 Logado como ${client.user.tag}`);

  try {
    const canal = await client.channels.fetch(canalId);
    if (canal) {
      await canal.send("✅ Bot iniciado! Vou avisar em **:55** e **:00**.");
    }
  } catch (e) {
    console.error("❌ Erro ao enviar mensagem inicial:", e);
  }

  iniciarSchedulerPorMinuto();
});

function iniciarSchedulerPorMinuto() {
  const agora = new Date();
  // alinha o primeiro tick exatamente na próxima virada de minuto
  const msAteProxMin =
    60000 - (agora.getSeconds() * 1000 + agora.getMilliseconds());

  console.log(`⏱️ Alinhando... próximo tick em ${msAteProxMin} ms`);
  setTimeout(() => {
    tick(); // roda na virada
    setInterval(tick, 60 * 1000); // depois, a cada minuto certinho
  }, msAteProxMin);
}

function tick() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const stampHora = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${h}`;

  // DEBUG no PowerShell
  console.log(`[${now.toLocaleTimeString()}] tick -> minuto=${m}`);

  // :55 → 5 min antes
  if (m === 55 && ultimoAviso55 !== stampHora) {
    ultimoAviso55 = stampHora;
    enviarRaid(
      `⚔️ <@&${cargoRaidId}> Senhores, faltam 5 minutos para a Raid iniciar. Preparem-se!`
    );
  }

  // :00 → início da raid
  if (m === 0 && ultimoAviso00 !== stampHora) {
    ultimoAviso00 = stampHora;
    enviarRaid(`🔥 <@&${cargoRaidId}> A Raid está começando agora!`);
  }
}

async function enviarRaid(mensagem) {
  try {
    const canal = await client.channels.fetch(canalId);
    if (!canal) return console.log("⚠️ Canal não encontrado!");
    await canal.send({
      content: mensagem,
      // garante que o ping do cargo funcione mesmo se ele não for 'mencionável'
      allowedMentions: { roles: [cargoRaidId] },
    });
    console.log("📨 Aviso enviado.");
  } catch (err) {
    console.error("❌ Erro ao enviar aviso:", err);
  }
}

// --- NOVO CÓDIGO PARA RESOLVER O PROBLEMA DA RENDER ---
// Este código cria um pequeno servidor web. A Render precisa que seu serviço
// escute em uma porta para não ser "desligado". Isso não afeta o funcionamento
// do seu bot no Discord.
const server = http.createServer((req, res) => {
  // Define o código de status HTTP (200 = OK).
  res.statusCode = 200;
  // Define o tipo de conteúdo da resposta.
  res.setHeader('Content-Type', 'text/plain');
  // Encerra a resposta com a mensagem.
  res.end('O bot de Discord est\u00E1 rodando e est\u00E1 online!\n');
});

// Faz o servidor escutar em uma porta.
// Ele usará a porta fornecida pela Render (process.env.PORT) ou a porta 3000 por padrão.
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor web iniciado na porta ${port}!`);
});

// Faz o login do bot no Discord usando o token da variável de ambiente.
client.login(process.env.TOKEN);

// loga qualquer erro não tratado
process.on("unhandledRejection", (err) =>
  console.error("🚨 UnhandledRejection:", err)
);