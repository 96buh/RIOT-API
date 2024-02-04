import express from "express";
import axios from "axios";
import { dirname } from "path";
import { fileURLToPath } from "url";
import BodyParser from "body-parser";
import { render } from "ejs";
import e from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
// 伺服器的代碼
const regions = {
  TW: "tw2",
  JP: "jp1",
  KR: "kr",
};
// RIOT GAME API的API KEY
const headers = {
  "X-Riot-Token": "RGAPI-d06b0c60-3127-478c-a207-63c1b644cf5d",
};

app.use(express.static(__dirname + "/public"));
app.use(BodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs", { data: null });
});

app.post("/summoners", async (req, res) => {
  var username = req.body.username;
  var gameName = username.split("#")[0];
  var tagLine = username.split("#")[1];
  var region_code = regions[req.body.region];
  try {
    res.redirect(`/summoners/${region_code}/${gameName}-${tagLine}`);
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/summoners/:region_code/:gameName-:tagLine", async (req, res) => {
  const region_code = req.params.region_code;
  const gameName = req.params.gameName;
  const tagLine = req.params.tagLine;
  try {
    // 用RIOT GAME API取得玩家的PUUID
    var get_PUUID_URL = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    // 請求"亞洲"伺服器玩家的PUUID
    var result = await axios.get(get_PUUID_URL, { headers: headers });
    var user_puuid = result.data.puuid;
    console.log("召喚師PUUID: " + user_puuid);
    // 獲得召喚師資料 {id, accountId, puuid, name, profileIconId, revisionDate, summonerLevel}
    var summoner_URL = `https://${region_code}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${user_puuid}`;
    var result = await axios.get(summoner_URL, { headers: headers });
    var summoner_data = result.data;
    // 獲得召喚師積分資料 {queueType, tier, rank, summonerId, summonerName, leaguePoints, wins, losses}
    var encryptedSummonerId = summoner_data.id;
    console.log("召喚師id: " + encryptedSummonerId);
    var league_URL = `https://${region_code}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`;
    var result = await axios.get(league_URL, { headers: headers });
    var league_data = result.data; // 這是一個陣列裡面有單雙排和彈性積分的資料

    res.render("summoner.ejs", {
      summoner_data: summoner_data,
      gameName: gameName,
      tagLine: tagLine,
      league_data: league_data,
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
