require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// IDs fixos
const canalId = "1407072932408328202";          // canal dos avisos
const cargoRaidId = "1407313985576898571";      // 🌍| Raid World

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

client.login(process.env.TOKEN);

// loga qualquer erro não tratado
process.on("unhandledRejection", (err) =>
  console.error("🚨 UnhandledRejection:", err)
);